<?php

declare(strict_types=1);

namespace Drupal\newsroom_syndication\Event;

/**
 * Defines domain events for the Newsroom wire system.
 */
final class NewsroomEvents {

  /**
   * Dispatched whenever a wire dispatch is published or transitioned to live.
   *
   * @Event
   *
   * @var string
   */
  public const WIRE_PUBLISHED = 'newsroom.wire_published';

  /**
   * Dispatched whenever a wire dispatch is updated with breaking/flash status.
   *
   * @Event
   *
   * @var string
   */
  public const WIRE_FLASH_ALERT = 'newsroom.wire_flash_alert';

}
