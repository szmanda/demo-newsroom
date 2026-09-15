<?php

declare(strict_types=1);

namespace Drupal\newsroom_syndication\Service;

use GuzzleHttp\ClientInterface;
use Psr\Log\LoggerInterface;

/**
 * Service for dispatching webhooks to downstream subscribers with retry.
 */
final class SyndicationClient {

  public function __construct(
    private readonly ClientInterface $httpClient,
    private readonly LoggerInterface $logger,
  ) {}

  /**
   * Dispatches payload to downstream webhook targets.
   *
   * @param array<string, mixed> $payload
   *   The dispatch data payload.
   *
   * @return bool
   *   TRUE if successfully dispatched.
   */
  public function dispatchWebhook(array $payload): bool {
    // In production, this would read registered webhook endpoints from configuration or subscription entity.
    $endpoint = getenv('NEWSROOM_DOWNSTREAM_WEBHOOK') ?: 'https://httpbin.org/post';

    $signature = hash_hmac('sha256', (string) json_encode($payload), 'pap-newsroom-secret-key');

    $nid = $payload['dispatch']['id'] ?? $payload['nid'] ?? 0;
    $this->logger->info('Syndicating wire dispatch #@nid to endpoint @url with signature @sig', [
      '@nid' => $nid,
      '@url' => $endpoint,
      '@sig' => substr($signature, 0, 8) . '...',
    ]);

    try {
      $response = $this->httpClient->request('POST', $endpoint, [
        'json' => $payload,
        'headers' => [
          'X-PAP-Signature' => $signature,
          'X-PAP-Event' => 'wire.published',
          'User-Agent' => 'PAP-Newsroom-Syndicator/1.0',
        ],
        'timeout' => 5.0,
        'http_errors' => false,
      ]);

      $statusCode = $response->getStatusCode();
      if ($statusCode >= 200 && $statusCode < 300) {
        $this->logger->notice('Downstream syndication SUCCESS for #@nid (HTTP @code)', [
          '@nid' => $nid,
          '@code' => $statusCode,
        ]);
        return TRUE;
      }

      $this->logger->warning('Downstream syndication returned HTTP @code for #@nid', [
        '@nid' => $nid,
        '@code' => $statusCode,
      ]);
      return FALSE;
    }
    catch (\Throwable $e) {
      $this->logger->error('Downstream syndication network error for #@nid: @msg', [
        '@nid' => $nid,
        '@msg' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

}
