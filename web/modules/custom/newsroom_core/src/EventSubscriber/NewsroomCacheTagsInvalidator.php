<?php

declare(strict_types=1);

namespace Drupal\newsroom_core\EventSubscriber;

use Drupal\Core\Cache\CacheTagsInvalidatorInterface;
use Drupal\newsroom_core\Service\VarnishPurgerService;

/**
 * Cache tags invalidator that purges Varnish when wire items are updated.
 */
final class NewsroomCacheTagsInvalidator implements CacheTagsInvalidatorInterface {

  public function __construct(
    private readonly VarnishPurgerService $varnishPurger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function invalidateTags(array $tags): void {
    $this->varnishPurger->banTags($tags);
  }

}
