<?php

declare(strict_types=1);

namespace Drupal\newsroom_syndication\Plugin\QueueWorker;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\Queue\RequeueException;
use Drupal\newsroom_api\Normalizer\WireDispatchNormalizer;
use Drupal\newsroom_syndication\Service\SyndicationClient;
use Drupal\node\NodeInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Queue worker processing downstream wire syndication.
 *
 * @QueueWorker(
 *   id = "newsroom_syndication_queue",
 *   title = @Translation("Newsroom Downstream Syndication Dispatcher"),
 *   cron = {"time" = 60}
 * )
 */
final class SyndicationQueueWorker extends QueueWorkerBase implements ContainerFactoryPluginInterface {

  private const MAX_ATTEMPTS = 3;

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly WireDispatchNormalizer $normalizer,
    private readonly SyndicationClient $syndicationClient,
    private readonly LoggerInterface $logger,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager'),
      $container->get('newsroom_api.normalizer'),
      $container->get('newsroom_syndication.client'),
      $container->get('logger.channel.newsroom_syndication')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function processItem($data): void {
    $nid = (int) ($data['nid'] ?? 0);
    $attempts = (int) ($data['attempts'] ?? 0);

    if ($nid <= 0) {
      return;
    }

    $nodeStorage = $this->entityTypeManager->getStorage('node');
    /** @var \Drupal\node\NodeInterface|null $node */
    $node = $nodeStorage->load($nid);

    if (!$node || !$node->isPublished()) {
      $this->logger->notice('Skipping syndication for node @nid: not found or not published.', ['@nid' => $nid]);
      return;
    }

    $normalized = $this->normalizer->normalize($node);
    $payload = [
      'event' => 'wire.published',
      'dispatch' => $normalized,
      'enqueued_at' => $data['timestamp'] ?? time(),
      'attempt' => $attempts + 1,
    ];

    $success = $this->syndicationClient->dispatchWebhook($payload);

    if ($success) {
      if ($node->hasField('field_syndication_status')) {
        $node->set('field_syndication_status', 'dispatched');
        $node->setSyncing(TRUE);
        $node->save();
      }
    }
    else {
      if ($attempts < self::MAX_ATTEMPTS) {
        $data['attempts'] = $attempts + 1;
        $this->logger->warning('Requeuing syndication for node @nid (attempt @att/@max)', [
          '@nid' => $nid,
          '@att' => $data['attempts'],
          '@max' => self::MAX_ATTEMPTS,
        ]);
        throw new RequeueException("Temporary failure sending syndication for node $nid");
      }

      if ($node->hasField('field_syndication_status')) {
        $node->set('field_syndication_status', 'failed');
        $node->setSyncing(TRUE);
        $node->save();
      }
    }
  }

}
