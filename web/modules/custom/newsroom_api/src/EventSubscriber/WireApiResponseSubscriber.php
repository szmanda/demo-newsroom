<?php

declare(strict_types=1);

namespace Drupal\newsroom_api\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Ensures edge caching and CORS headers are preserved on API wire endpoints.
 */
final class WireApiResponseSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::REQUEST => ['onRequest', 100],
      KernelEvents::RESPONSE => ['onRespond', -50],
    ];
  }

  /**
   * Handles CORS preflight OPTIONS requests for the Wire API.
   */
  public function onRequest(RequestEvent $event): void {
    $request = $event->getRequest();
    $path = $request->getPathInfo();

    if (str_starts_with($path, '/api/v1/wire') && $request->getMethod() === 'OPTIONS') {
      $response = new Response('', Response::HTTP_NO_CONTENT, [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Newsroom-Api-Key, Cache-Control, X-Requested-With',
        'Access-Control-Max-Age' => '86400',
      ]);
      $event->setResponse($response);
    }
  }

  /**
   * Sets Edge caching and CORS headers for Wire API.
   */
  public function onRespond(ResponseEvent $event): void {
    $request = $event->getRequest();
    $path = $request->getPathInfo();

    if (str_starts_with($path, '/api/v1/wire')) {
      $response = $event->getResponse();

      // Add CORS headers.
      $response->headers->set('Access-Control-Allow-Origin', '*');
      $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Newsroom-Api-Key, Cache-Control, X-Requested-With');

      if ($response->getStatusCode() === 200) {
        $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60');
      }
    }
  }

}
