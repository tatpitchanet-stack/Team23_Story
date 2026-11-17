<?php
// GET /api/items.php               → ผลงานทั้งหมด (200)
// GET /api/items.php?profileId=ID  → เฉพาะผลงานของโปรไฟล์นั้น
// POST /api/items.php              → สร้างผลงาน (201) หรือ 400 {"errors": [...]}
require __DIR__ . '/../../src/helpers.php';

requireMethod('GET', 'POST');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $items = readList(ITEMS_FILE);
    if (isset($_GET['profileId'])) {
        $pid = (string) $_GET['profileId'];
        $items = array_values(array_filter($items, function ($i) use ($pid) {
            return (string) $i['profileId'] === $pid;
        }));
    }
    sendJson(200, $items);
}

$d = readJsonBody();
$errors = validateItem($d);
if (count($errors) > 0) {
    badRequest($errors);
}

// profileId ต้องมีอยู่จริง
$found = false;
foreach (readList(PROFILES_FILE) as $p) {
    if ((string) $p['id'] === (string) $d['profileId']) {
        $found = true;
    }
}
if (!$found) {
    badRequest(['ไม่พบโปรไฟล์เจ้าของผลงาน']);
}

$item = updateList(ITEMS_FILE, function ($list) use ($d) {
    $i = [
        'id' => 'item' . nextId($list),
        'profileId' => (string) $d['profileId'],
        'title' => trim($d['title']),
        'type' => trim($d['type']),
        'date' => trim($d['date']),
        'role' => trim($d['role']),
        'description' => trim($d['description']),
        'skills' => array_map('trim', array_values($d['skills'])),
        'reflection' => [
            'whatIDid' => trim($d['reflection']['whatIDid']),
            'whatILearned' => trim($d['reflection']['whatILearned']),
            'challenge' => trim($d['reflection']['challenge']),
            'nextStep' => trim($d['reflection']['nextStep'])
        ],
        'evidence' => array_map('trim', array_values($d['evidence']))
    ];
    $list[] = $i;
    return [$list, $i];
});
sendJson(201, $item);
