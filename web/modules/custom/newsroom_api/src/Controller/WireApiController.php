<?php

declare(strict_types=1);

namespace Drupal\newsroom_api\Controller;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Cache\CacheableJsonResponse;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\newsroom_api\Normalizer\WireDispatchNormalizer;
use Drupal\node\Entity\Node;
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
   * POST /api/v1/wire/create
   */
  public function publish(Request $request): Response {
    $expectedApiKey = getenv('NEWSROOM_API_KEY') ?: 'secret-pap-editorial-key';
    $apiKey = $request->headers->get('X-Newsroom-Api-Key');
    $authHeader = $request->headers->get('Authorization', '');

    if (empty($apiKey) && str_starts_with($authHeader, 'Bearer ')) {
      $apiKey = substr($authHeader, 7);
    }

    if (empty($apiKey) || !hash_equals((string) $expectedApiKey, (string) $apiKey)) {
      return $this->problemResponse(
        'https://pap.pl/errors/unauthorized',
        'Unauthorized',
        Response::HTTP_UNAUTHORIZED,
        'Invalid or missing editorial API key in X-Newsroom-Api-Key or Authorization header.',
        $request->getRequestUri()
      );
    }

    $rawContent = $request->getContent();
    $data = json_decode($rawContent, TRUE);
    if (!is_array($data)) {
      return $this->problemResponse(
        'https://pap.pl/errors/invalid-payload',
        'Invalid JSON Payload',
        Response::HTTP_BAD_REQUEST,
        'The request body must be valid JSON.',
        $request->getRequestUri()
      );
    }

    $title = trim((string) ($data['title'] ?? ''));
    if ($title === '') {
      return $this->problemResponse(
        'https://pap.pl/errors/validation-failed',
        'Validation Failed',
        Response::HTTP_UNPROCESSABLE_ENTITY,
        'The "title" field is required.',
        $request->getRequestUri()
      );
    }

    $urgency = strtoupper(trim((string) ($data['urgency_level'] ?? 'ROUTINE')));
    $validUrgencies = ['FLASH', 'URGENT', 'ROUTINE'];
    if (!in_array($urgency, $validUrgencies, TRUE)) {
      return $this->problemResponse(
        'https://pap.pl/errors/invalid-urgency',
        'Invalid Urgency Level',
        Response::HTTP_BAD_REQUEST,
        sprintf('Urgency must be one of: %s', implode(', ', $validUrgencies)),
        $request->getRequestUri()
      );
    }

    $categoryId = NULL;
    if (!empty($data['category'])) {
      if (is_numeric($data['category'])) {
        $categoryId = (int) $data['category'];
      }
      else {
        $terms = $this->entityTypeManagerService->getStorage('taxonomy_term')
          ->loadByProperties(['vid' => 'wire_category', 'name' => trim((string) $data['category'])]);
        if (!empty($terms)) {
          $term = reset($terms);
          $categoryId = (int) $term->id();
        }
      }
    }

    $lead = trim((string) ($data['lead'] ?? ''));
    $body = trim((string) ($data['body'] ?? ''));
    $signature = trim((string) ($data['author_signature'] ?? '(PAP) desk'));

    $nodeValues = [
      'type' => 'wire_dispatch',
      'title' => $title,
      'field_lead' => [
        'value' => $lead,
        'format' => 'plain_text',
      ],
      'body' => [
        'value' => $body,
        'format' => 'plain_text',
      ],
      'field_urgency_level' => $urgency,
      'field_author_signature' => $signature,
      'moderation_state' => 'published',
      'status' => 1,
    ];

    if ($categoryId !== NULL) {
      $nodeValues['field_category'] = ['target_id' => $categoryId];
    }

    if (!empty($data['embargo_until'])) {
      $nodeValues['field_embargo_until'] = (string) $data['embargo_until'];
    }

    $node = Node::create($nodeValues);
    $node->save();

    // Invalidate list cache tag so Varnish / API feeds immediately reflect the new dispatch.
    Cache::invalidateTags(['node_list:wire_dispatch']);

    $normalized = $this->normalizer->normalize($node);
    return new JsonResponse(['data' => $normalized], Response::HTTP_CREATED);
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
