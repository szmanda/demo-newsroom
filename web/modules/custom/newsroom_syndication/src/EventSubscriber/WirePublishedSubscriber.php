<?php

declare(strict_types=1);

namespace Drupal\newsroom_syndication\EventSubscriber;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\newsroom_syndication\Event\NewsroomEvents;
use Drupal\newsroom_syndication\Event\WirePublishedEvent;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Listens for WIRE_PUBLISHED and enqueues syndication payload.
 */
final class WirePublishedSubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly QueueFactory $queueFactory,
    private readonly LoggerInterface $logger,
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      NewsroomEvents::WIRE_PUBLISHED => ['onWirePublished', 10],
    ];
  }

  /**
   * Reacts to wire published event.
   */
  public function onWirePublished(WirePublishedEvent $event): void {
    $node = $event->getNode();
    $nid = (int) $node->id();

    $this->logger->info('Wire dispatch #@nid published. Enqueuing syndication webhook job.', [
      '@nid' => $nid,
    ]);

    $queue = $this->queueFactory->get('newsroom_syndication_queue');
    $queueItem = [
      'nid' => $nid,
      'title' => $node->label(),
      'timestamp' => time(),
      'attempts' => 0,
    ];
    $queue->createItem($queueItem);

    // Update status to 'queued' without triggering infinite recursion.
    try {
      $storage = $this->entityTypeManager->getStorage('node');
      /** @var \Drupal\node\NodeInterface|null $freshNode */
      $freshNode = $storage->load($nid);
      if ($freshNode && $freshNode->hasField('field_syndication_status')) {
        $freshNode->set('field_syndication_status', 'queued');
        $freshNode->setSyncing(TRUE);
        $freshNode->save();
      }
    }
    catch (\Throwable $e) {
      $this->logger->error('Failed to update syndication status to queued: @msg', [
        '@msg' => $e->getMessage(),
      ]);
    }
  }

}
