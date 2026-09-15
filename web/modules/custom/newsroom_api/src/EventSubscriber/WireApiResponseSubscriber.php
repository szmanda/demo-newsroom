<?php

declare(strict_types=1);

namespace Drupal\newsroom_api\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Ensures public edge caching headers are preserved on API wire endpoints.
 */
final class WireApiResponseSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    // Run after FinishResponseSubscriber (priority 0).
    return [
      KernelEvents::RESPONSE => ['onRespond', -50],
    ];
  }

  /**
   * Sets Edge and Varnish friendly Cache-Control headers for Wire API.
   */
  public function onRespond(ResponseEvent $event): void {
    $request = $event->getRequest();
    $path = $request->getPathInfo();

    if (str_starts_with($path, '/api/v1/wire')) {
      $response = $event->getResponse();
      if ($response->getStatusCode() === 200) {
        $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60');
      }
    }
  }

}
