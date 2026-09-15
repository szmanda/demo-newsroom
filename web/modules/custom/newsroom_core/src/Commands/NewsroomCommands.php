<?php

declare(strict_types=1);

namespace Drupal\newsroom_core\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\Core\Queue\QueueWorkerManagerInterface;
use Drupal\newsroom_security\Service\AuditLogService;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drush\Commands\DrushCommands;

/**
 * Drush commands for PAP Newsroom Wire system.
 */
final class NewsroomCommands extends DrushCommands {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly QueueFactory $queueFactory,
    private readonly QueueWorkerManagerInterface $queueWorkerManager,
    private readonly AuditLogService $auditLogService,
  ) {
    parent::__construct();
  }

  /**
   * Seed realistic sample PAP wire dispatches across all categories and urgency levels.
   *
   * @command newsroom:seed
   * @aliases nr-seed
   * @usage drush newsroom:seed
   */
  public function seed(): void {
    $this->logger()->notice('Seeding PAP Newsroom wire dispatches...');

    $categoryTerms = [];
    $terms = $this->entityTypeManager->getStorage('taxonomy_term')
      ->loadByProperties(['vid' => 'wire_category']);

    foreach ($terms as $term) {
      $categoryTerms[$term->label()] = $term->id();
    }

    $samples = [
      [
        'title' => 'FLASH: RPP utrzymała stopy procentowe NBP na niezmienionym poziomie',
        'lead' => 'Rada Polityki Pieniężnej na wtorkowym posiedzeniu zdecydowała o pozostawieniu stóp procentowych NBP bez zmian - poinformował bank centralny.',
        'body' => "Warszawa (PAP) - Główna stopa referencyjna NBP nadal wynosi 5,75 proc. Decyzja Rady była zgodna z konsensusem rynkowym analityków i ekonomistów.\n\nPrezes NBP przedstawi szczegółowe uzasadnienie decyzji oraz najnowszą projekcję inflacji i PKB podczas jutrzejszej konferencji prasowej o godz. 15:00.",
        'urgency' => 'FLASH',
        'category' => 'Gospodarka',
        'signature' => '(PAP) mkr/ agz',
        'state' => 'published',
      ],
      [
        'title' => 'Premier w Brukseli: Polska z kluczowym poparciem dla Tarczy Wschód',
        'lead' => 'Projekt Tarcza Wschód zyskał formalne wsparcie państw bałtyckich oraz wstępną deklarację współfinansowania z funduszy obronnych Unii Europejskiej.',
        'body' => "Bruksela (PAP) - Podczas szczytu Rady Europejskiej szef polskiego rządu przedstawił kompleksowy plan wzmocnienia wschodniej flanki NATO.\n\n\"Bezpieczeństwo granicy wschodniej to nie jest wyłącznie sprawa Polski, to sprawa całej Europy i Sojuszu Północnoatlantyckiego\" - podkreślono w oświadczeniu.",
        'urgency' => 'URGENT',
        'category' => 'Bezpieczeństwo',
        'signature' => '(PAP) reb/ ap',
        'state' => 'published',
      ],
      [
        'title' => 'Wybory prezydenckie w USA: Rekordowa frekwencja we wczesnym głosowaniu',
        'lead' => 'Ponad 45 milionów Amerykanów oddało już głos we wczesnym głosowaniu w kluczowych stanach wahających się (swing states).',
        'body' => "Waszyngton (PAP) - Analitycy zwracają uwagę na bezprecedensową mobilizację wyborców w Georgii, Karolinie Północnej i Pensylwanii. Ostateczne wyniki spodziewane są w nocy ze środy na czwartek czasu polskiego.",
        'urgency' => 'ROUTINE',
        'category' => 'Świat',
        'signature' => '(PAP) rk/ zgd',
        'state' => 'published',
      ],
      [
        'title' => 'Sejm uchwalił nowelizację ustawy o wsparciu transformacji energetycznej',
        'lead' => 'Nowe przepisy przewidują ułatwienia w procedurach środowiskowych dla morskich farm wiatrowych oraz sieci przesyłowych.',
        'body' => "Warszawa (PAP) - Za przyjęciem ustawy głosowało 242 posłów, przeciw było 188, a 9 wstrzymało się od głosu. Ustawa trafia teraz pod obrady Senatu.",
        'urgency' => 'ROUTINE',
        'category' => 'Polityka',
        'signature' => '(PAP) mmu/ pad',
        'state' => 'published',
      ],
      [
        'title' => 'Liga Mistrzów: Polski klub awansował do fazy pucharowej po historycznym meczu',
        'lead' => 'Zwycięstwo 3:1 w rewanżowym spotkaniu przed własną publicznością zapewniło historyczny awans do kolejnej rundy prestiżowych rozgrywek.',
        'body' => "Warszawa (PAP) - Dwie bramki zdobyte w drugiej połowie spotkania przesądziły o sukcesie. Losowanie par 1/8 finału odbędzie się w najbliższy piątek w Nyonie.",
        'urgency' => 'ROUTINE',
        'category' => 'Sport',
        'signature' => '(PAP) krys/ ceg',
        'state' => 'published',
      ],
      [
        'title' => 'PROJEKT: Pilny komunikat Ministerstwa Finansów ws. obligacji skarbowych (EMBARGO)',
        'lead' => 'Nowa oferta detalicznych obligacji skarbowych z preferencyjnym oprocentowaniem antyinflacyjnym rusza od 1 dnia przyszłego miesiąca.',
        'body' => "Warszawa (PAP) - Informacja objęta embargiem prasowym do godz. 18:00.\n\nSzczegóły nowej emisji obligacji zostaną opublikowane po zakończeniu sesji na GPW.",
        'urgency' => 'URGENT',
        'category' => 'Gospodarka',
        'signature' => '(PAP) mkr/ red',
        'state' => 'scheduled',
      ],
      [
        'title' => 'SZKIC: Raport analityczny o rozwoju sieci 5G i łączności kryzysowej w Polsce',
        'lead' => 'Wstępny szkic depeszy przygotowywanej przez dział gospodarczy PAP na temat aukcji pasm częstotliwości.',
        'body' => "Szkic roboczy depeszy w trakcie opracowywania przez zespół redakcyjny.",
        'urgency' => 'ROUTINE',
        'category' => 'Gospodarka',
        'signature' => '(PAP) aut/ desk',
        'state' => 'draft',
      ],
    ];

    foreach ($samples as $sample) {
      $catId = $categoryTerms[$sample['category']] ?? null;

      $node = Node::create([
        'type' => 'wire_dispatch',
        'title' => $sample['title'],
        'field_lead' => [
          'value' => $sample['lead'],
          'format' => 'plain_text',
        ],
        'body' => [
          'value' => $sample['body'],
          'format' => 'plain_text',
        ],
        'field_urgency_level' => $sample['urgency'],
        'field_author_signature' => $sample['signature'],
        'field_category' => $catId ? ['target_id' => $catId] : [],
        'moderation_state' => $sample['state'],
        'status' => ($sample['state'] === 'published') ? 1 : 0,
      ]);
      $node->save();

      $this->logger()->success(sprintf('Created dispatch #%d: [%s] "%s"', $node->id(), $sample['urgency'], $sample['title']));
    }

    $this->logger()->success('Wire seed completed successfully!');
  }

  /**
   * Verify tamper-evident cryptographic audit log chain.
   *
   * @command newsroom:verify-audit
   * @aliases nr-audit
   * @usage drush newsroom:verify-audit
   */
  public function verifyAudit(): void {
    $this->logger()->notice('Verifying cryptographic audit log integrity across all wire dispatches...');

    $query = $this->entityTypeManager->getStorage('node')->getQuery()
      ->accessCheck(FALSE)
      ->condition('type', 'wire_dispatch');
    $nids = $query->execute();

    if (empty($nids)) {
      $this->logger()->warning('No wire dispatches found in database.');
      return;
    }

    $total = 0;
    $allValid = true;

    foreach ($nids as $nid) {
      $result = $this->auditLogService->verifyChain((int) $nid);
      $total += $result['count'] ?? 0;

      if (!$result['valid']) {
        $allValid = false;
        $this->logger()->error(sprintf('Integrity Violation on Wire #%d: %s', $nid, $result['message']));
      }
      else {
        $this->logger()->info(sprintf('Wire #%d: OK (%d audit records verified, hash: %s...)', $nid, $result['count'], substr($result['latest_hash'] ?? '0', 0, 8)));
      }
    }

    if ($allValid) {
      $this->logger()->success(sprintf('Audit integrity 100%% VALID across all %d dispatches (%d total cryptographic entries verified).', count($nids), $total));
    }
    else {
      $this->logger()->error('CRITICAL: Audit integrity verification FAILED for one or more records!');
    }
  }

  /**
   * Process downstream syndication queue.
   *
   * @command newsroom:syndicate
   * @aliases nr-syndicate
   * @usage drush newsroom:syndicate
   */
  public function processSyndication(): void {
    $this->logger()->notice('Processing downstream syndication queue...');
    $queue = $this->queueFactory->get('newsroom_syndication_queue');
    /** @var \Drupal\Core\Queue\QueueWorkerInterface $worker */
    $worker = $this->queueWorkerManager->createInstance('newsroom_syndication_queue');

    $processed = 0;
    while ($item = $queue->claimItem(60)) {
      try {
        $worker->processItem($item->data);
        $queue->deleteItem($item);
        $processed++;
        $this->logger()->info("Processed syndication item for node #{$item->data['nid']}");
      }
      catch (\Throwable $e) {
        $this->logger()->error("Failed processing item: {$e->getMessage()}");
        $queue->releaseItem($item);
      }
    }

    $this->logger()->success("Syndication queue processing completed: $processed items dispatched.");
  }

}
