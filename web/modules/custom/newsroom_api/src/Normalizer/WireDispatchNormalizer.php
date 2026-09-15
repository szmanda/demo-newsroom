<?php

declare(strict_types=1);

namespace Drupal\newsroom_api\Normalizer;

use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\TermInterface;

/**
 * High-performance normalizer for wire dispatches.
 */
final class WireDispatchNormalizer {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly DateFormatterInterface $dateFormatter,
  ) {}

  /**
   * Normalizes a wire dispatch node into an optimized array representation.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The wire dispatch node.
   *
   * @return array<string, mixed>
   *   The serialized representation.
   */
  public function normalize(NodeInterface $node): array {
    $categoryData = null;
    if ($node->hasField('field_category') && !$node->get('field_category')->isEmpty()) {
      $term = $node->get('field_category')->entity;
      if ($term instanceof TermInterface) {
        $categoryData = [
          'id' => (int) $term->id(),
          'name' => $term->label(),
        ];
      }
    }

    $lead = $node->hasField('field_lead') && !$node->get('field_lead')->isEmpty()
      ? $node->get('field_lead')->value
      : '';

    $body = $node->hasField('body') && !$node->get('body')->isEmpty()
      ? $node->get('body')->value
      : '';

    $urgency = $node->hasField('field_urgency_level') && !$node->get('field_urgency_level')->isEmpty()
      ? (string) $node->get('field_urgency_level')->value
      : 'ROUTINE';

    $signature = $node->hasField('field_author_signature') && !$node->get('field_author_signature')->isEmpty()
      ? (string) $node->get('field_author_signature')->value
      : '';

    $embargo = null;
    if ($node->hasField('field_embargo_until') && !$node->get('field_embargo_until')->isEmpty()) {
      $embargo = (string) $node->get('field_embargo_until')->value;
    }

    $createdIso = $this->dateFormatter->format((int) $node->getCreatedTime(), 'custom', 'c');
    $changedIso = $this->dateFormatter->format((int) $node->getChangedTime(), 'custom', 'c');

    return [
      'id' => (int) $node->id(),
      'uuid' => $node->uuid(),
      'type' => 'wire_dispatch',
      'title' => $node->label(),
      'lead' => $lead,
      'body' => $body,
      'urgency_level' => $urgency,
      'category' => $categoryData,
      'author_signature' => $signature,
      'embargo_until' => $embargo,
      'created' => $createdIso,
      'changed' => $changedIso,
      'is_flash' => ($urgency === 'FLASH'),
    ];
  }

}
