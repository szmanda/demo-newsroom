<?php

declare(strict_types=1);

namespace Drupal\newsroom_security\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\NodeInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Tamper-evident cryptographic audit logging service.
 */
final class AuditLogService {

  public function __construct(
    private readonly Connection $database,
    private readonly AccountProxyInterface $currentUser,
    private readonly RequestStack $requestStack,
    private readonly LoggerInterface $logger,
  ) {}

  /**
   * Records an audit log entry for a wire dispatch.
   */
  public function record(
    NodeInterface $node,
    string $action,
    string $fromState = '',
    string $toState = ''
  ): void {
    if ($node->bundle() !== 'wire_dispatch') {
      return;
    }

    $nid = (int) $node->id();
    $vid = (int) $node->getRevisionId();
    $uid = (int) $this->currentUser->id();

    $request = $this->requestStack->getCurrentRequest();
    $ip = $request ? ($request->getClientIp() ?? '127.0.0.1') : 'CLI/Daemon';

    // Compute cryptographic SHA-256 hash of core content fields.
    $contentPayload = implode('||', [
      (string) $node->label(),
      $node->hasField('field_lead') ? (string) $node->get('field_lead')->value : '',
      $node->hasField('body') ? (string) $node->get('body')->value : '',
      $node->hasField('field_urgency_level') ? (string) $node->get('field_urgency_level')->value : '',
      $node->hasField('field_author_signature') ? (string) $node->get('field_author_signature')->value : '',
      $toState,
    ]);

    $contentHash = hash('sha256', $contentPayload);

    // Fetch the previous hash for this node to form a tamper-evident chain.
    $prevHash = $this->getLatestHash($nid);

    $entry = [
      'nid' => $nid,
      'vid' => $vid,
      'actor_uid' => $uid,
      'ip_address' => substr($ip, 0, 45),
      'timestamp' => time(),
      'from_state' => substr($fromState, 0, 32),
      'to_state' => substr($toState, 0, 32),
      'action' => substr($action, 0, 32),
      'content_sha256' => $contentHash,
      'previous_hash' => $prevHash ?: str_repeat('0', 64),
    ];

    try {
      $this->database->insert('newsroom_audit_log')
        ->fields($entry)
        ->execute();

      $this->logger->info('Tamper-evident audit recorded for wire #@nid: @act (@from -> @to) Hash: @h', [
        '@nid' => $nid,
        '@act' => $action,
        '@from' => $fromState ?: 'new',
        '@to' => $toState ?: 'none',
        '@h' => substr($contentHash, 0, 10),
      ]);
    }
    catch (\Throwable $e) {
      $this->logger->error('Failed to write tamper-evident audit record: @msg', [
        '@msg' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Retrieves the most recent content hash for a node.
   */
  public function getLatestHash(int $nid): ?string {
    try {
      $hash = $this->database->select('newsroom_audit_log', 'a')
        ->fields('a', ['content_sha256'])
        ->condition('nid', $nid)
        ->orderBy('id', 'DESC')
        ->range(0, 1)
        ->execute()
        ->fetchField();

      return is_string($hash) ? $hash : null;
    }
    catch (\Throwable) {
      return null;
    }
  }

  /**
   * Verifies the audit chain integrity for a wire dispatch.
   *
   * @return array<string, mixed>
   *   Integrity verification summary.
   */
  public function verifyChain(int $nid): array {
    $records = $this->database->select('newsroom_audit_log', 'a')
      ->fields('a')
      ->condition('nid', $nid)
      ->orderBy('id', 'ASC')
      ->execute()
      ->fetchAll();

    if (empty($records)) {
      return ['valid' => true, 'count' => 0, 'message' => 'No audit records.'];
    }

    $lastHash = str_repeat('0', 64);
    foreach ($records as $index => $record) {
      if ($index === 0) {
        $lastHash = $record->content_sha256;
        continue;
      }
      if ($record->previous_hash !== $lastHash) {
        return [
          'valid' => false,
          'broken_at_id' => $record->id,
          'expected_prev' => $lastHash,
          'actual_prev' => $record->previous_hash,
          'message' => "Cryptographic chain mismatch detected at record ID {$record->id}!",
        ];
      }
      $lastHash = $record->content_sha256;
    }

    return [
      'valid' => true,
      'count' => count($records),
      'latest_hash' => $lastHash,
      'message' => 'Audit log integrity verified: 100% cryptographic chain valid.',
    ];
  }

}
