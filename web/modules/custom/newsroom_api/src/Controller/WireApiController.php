<?php

declare(strict_types=1);

namespace Drupal\newsroom_api\Controller;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Cache\CacheableJsonResponse;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\newsroom_api\Normalizer\WireDispatchNormalizer;
use Drupal\node\NodeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Controller for Headless Wire REST API with RFC 7807 problem details and edge caching headers.
 */
final class WireApiController extends ControllerBase {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManagerService,
    private readonly WireDispatchNormalizer $normalizer,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('newsroom_api.normalizer')
    );
  }

  /**
   * GET /api/v1/wire/latest
   */
  public function latest(Request $request): Response {
    $limit = (int) $request->query->get('limit', '20');
    $offset = (int) $request->query->get('offset', '0');
    $category = $request->query->get('category');
    $urgency = $request->query->get('urgency');

    if ($limit < 1 || $limit > 100) {
      return $this->problemResponse(
        'https://pap.pl/errors/invalid-parameters',
        'Invalid Query Parameter',
        Response::HTTP_BAD_REQUEST,
        'The limit parameter must be between 1 and 100.',
        $request->getRequestUri()
      );
    }

    $cacheMetadata = new CacheableMetadata();
    $cacheMetadata->setCacheMaxAge(3600);
    $cacheMetadata->addCacheTags(['node_list:wire_dispatch']);
    $cacheMetadata->addCacheContexts(['url.query_args']);

    $nodeStorage = $this->entityTypeManagerService->getStorage('node');
    $query = $nodeStorage->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'wire_dispatch')
      ->condition('status', NodeInterface::PUBLISHED)
      ->sort('created', 'DESC')
      ->range($offset, $limit);

    if (!empty($urgency)) {
      $validUrgencies = ['FLASH', 'URGENT', 'ROUTINE'];
      if (!in_array(strtoupper((string) $urgency), $validUrgencies, TRUE)) {
        return $this->problemResponse(
          'https://pap.pl/errors/invalid-urgency',
          'Invalid Urgency Level',
          Response::HTTP_BAD_REQUEST,
          sprintf('Urgency must be one of: %s', implode(', ', $validUrgencies)),
          $request->getRequestUri()
        );
      }
      $query->condition('field_urgency_level', strtoupper((string) $urgency));
    }

    if (!empty($category)) {
      if (is_numeric($category)) {
        $query->condition('field_category', (int) $category);
      }
      else {
        // Query category term by name.
        $terms = $this->entityTypeManagerService->getStorage('taxonomy_term')
          ->loadByProperties(['vid' => 'wire_category', 'name' => $category]);
        if (!empty($terms)) {
          $term = reset($terms);
          $query->condition('field_category', $term->id());
        }
      }
    }

    $nids = $query->execute();
    /** @var \Drupal\node\NodeInterface[] $nodes */
    $nodes = !empty($nids) ? $nodeStorage->loadMultiple($nids) : [];

    $data = [];
    foreach ($nodes as $node) {
      $data[] = $this->normalizer->normalize($node);
      $cacheMetadata->addCacheableDependency($node);
    }

    $responsePayload = [
      'meta' => [
        'count' => count($data),
        'offset' => $offset,
        'limit' => $limit,
        'generated_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
      ],
      'data' => $data,
    ];

    $response = new CacheableJsonResponse($responsePayload, Response::HTTP_OK);
    $response->addCacheableDependency($cacheMetadata);

    // Add Varnish / Edge cache headers with stale-while-revalidate and Cache-Tags.
    $cacheTags = implode(' ', $cacheMetadata->getCacheTags());
    $response->headers->set('X-Cache-Tags', $cacheTags);
    $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60');

    return $response;
  }

  /**
   * GET /api/v1/wire/{id}
   */
  public function item(Request $request, int $id): Response {
    $nodeStorage = $this->entityTypeManagerService->getStorage('node');
    /** @var \Drupal\node\NodeInterface|null $node */
    $node = $nodeStorage->load($id);

    if (!$node || $node->bundle() !== 'wire_dispatch' || !$node->isPublished()) {
      return $this->problemResponse(
        'https://pap.pl/errors/not-found',
        'Wire Dispatch Not Found',
        Response::HTTP_NOT_FOUND,
        sprintf('No published wire dispatch found with ID %d.', $id),
        $request->getRequestUri()
      );
    }

    $cacheMetadata = new CacheableMetadata();
    $cacheMetadata->setCacheMaxAge(3600);
    $cacheMetadata->addCacheableDependency($node);

    $normalized = $this->normalizer->normalize($node);
    $response = new CacheableJsonResponse(['data' => $normalized], Response::HTTP_OK);
    $response->addCacheableDependency($cacheMetadata);

    $cacheTags = implode(' ', $cacheMetadata->getCacheTags());
    $response->headers->set('X-Cache-Tags', $cacheTags);
    $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60');

    return $response;
  }

  /**
   * Formats an RFC 7807 Problem Details JSON Response.
   */
  private function problemResponse(
    string $type,
    string $title,
    int $status,
    string $detail,
    string $instance
  ): JsonResponse {
    return new JsonResponse(
      [
        'type' => $type,
        'title' => $title,
        'status' => $status,
        'detail' => $detail,
        'instance' => $instance,
        'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
      ],
      $status,
      ['Content-Type' => 'application/problem+json']
    );
  }

}
