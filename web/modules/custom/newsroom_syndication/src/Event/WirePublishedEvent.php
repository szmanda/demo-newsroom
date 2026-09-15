<?php

declare(strict_types=1);

namespace Drupal\newsroom_syndication\Event;

use Drupal\Component\EventDispatcher\Event;
use Drupal\node\NodeInterface;

/**
 * Event raised when a wire dispatch is published.
 */
final class WirePublishedEvent extends Event {

  public function __construct(
    private readonly NodeInterface $node,
    private readonly string $previousState = '',
    private readonly string $currentState = 'published',
  ) {}

  public function getNode(): NodeInterface {
    return $this->node;
  }

  public function getPreviousState(): string {
    return $this->previousState;
  }

  public function getCurrentState(): string {
    return $this->currentState;
  }

}
