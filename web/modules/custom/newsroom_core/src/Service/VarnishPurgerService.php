<?php

declare(strict_types=1);

namespace Drupal\newsroom_core\Service;

use GuzzleHttp\ClientInterface;
use Psr\Log\LoggerInterface;

/**
 * Service to dispatch instant BAN requests to Varnish reverse proxy upon Cache Tag invalidation.
 */
final class VarnishPurgerService {

  public function __construct(
    private readonly ClientInterface $httpClient,
    private readonly LoggerInterface $logger,
  ) {}

  /**
   * Sends a BAN request for the specified cache tags to Varnish.
   *
   * @param string[] $tags
   *   Cache tags to ban.
   */
  public function banTags(array $tags): void {
    if (empty($tags)) {
      return;
    }

    // Filter relevant newsroom tags to avoid flooding.
    $relevantTags = array_filter($tags, static function ($tag) {
      return str_starts_with($tag, 'node') ||
             str_starts_with($tag, 'taxonomy_term') ||
             str_starts_with($tag, 'wire');
    });

    if (empty($relevantTags)) {
      return;
    }

    $varnishHost = getenv('VARNISH_HOST') ?: 'varnish';
    $varnishPort = getenv('VARNISH_PORT') ?: '80';
    $url = "http://$varnishHost:$varnishPort/";

    // Build regex pattern matching any of the tags.
    $pattern = '(' . implode('|', array_map('preg_quote', $relevantTags)) . ')';

    try {
      $response = $this->httpClient->request('BAN', $url, [
        'headers' => [
          'X-Cache-Tags' => $pattern,
        ],
        'timeout' => 2.0,
        'http_errors' => false,
      ]);

      $this->logger->info('Varnish BAN sent for tags: @tags (HTTP @code)', [
        '@tags' => implode(' ', $relevantTags),
        '@code' => $response->getStatusCode(),
      ]);
    }
    catch (\Throwable $e) {
      $this->logger->warning('Failed sending Varnish BAN for tags @tags: @msg', [
        '@tags' => implode(' ', $relevantTags),
        '@msg' => $e->getMessage(),
      ]);
    }
  }

}
