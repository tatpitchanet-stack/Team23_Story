<?php
// GET /api/items.php               → ผลงานทั้งหมด (200)
// GET /api/items.php?profileId=ID  → เฉพาะผลงานของโปรไฟล์นั้น
// POST /api/items.php              → สร้างผลงาน (201), 400 {"errors": [...]}, หรือ 409 ถ้า Import ซ้ำ
// DELETE /api/items.php?id=ID      → ลบผลงาน (200) หรือ 404 ถ้าไม่พบ
require __DIR__ . '/../../src/helpers.php';

requireMethod('GET', 'POST', 'DELETE');

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

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!is_string($id) || trim($id) === '' || strlen($id) > 100) {
        badRequest(['ต้องระบุ id ของผลงานที่ต้องการลบ']);
    }
    $deleted = updateList(ITEMS_FILE, function ($list) use ($id) {
        $kept = array_values(array_filter($list, function ($i) use ($id) {
            return (string) $i['id'] !== $id;
        }));
        return [$kept, count($kept) !== count($list)];
    });
    if (!$deleted) {
        sendJson(404, ['errors' => ['ไม่พบผลงานที่ต้องการลบ']]);
    }
    sendJson(200, ['deleted' => $id]);
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
    $pid = (string) $d['profileId'];
    $newEv = array_map('trim', array_values($d['evidence']));
    $hasChallenge = isset($d['challengeId'], $d['hostGroup']);

    // กัน Import ซ้ำ (ตรวจเฉพาะในโปรไฟล์ปลายทาง)
    foreach ($list as $x) {
        if ((string) $x['profileId'] !== $pid) {
            continue;
        }
        $dupChallenge = $hasChallenge
            && isset($x['challengeId'], $x['hostGroup'])
            && $x['challengeId'] === trim($d['challengeId'])
            && $x['hostGroup'] === trim($d['hostGroup']);
        $dupContent = trim($x['title']) === trim($d['title'])
            && $x['date'] === trim($d['date'])
            && $x['evidence'] === $newEv;
        if ($dupChallenge || $dupContent) {
            return [$list, null]; // ซ้ำ: ไม่เขียนอะไร
        }
    }

    $i = [
        'id' => 'item' . nextId($list),
        'profileId' => $pid,
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
        'evidence' => $newEv
    ];
    // ฟิลด์เสริมของ Challenge
    foreach (['challengeId', 'hostGroup', 'category', 'schemaVersion'] as $f) {
        if (isset($d[$f])) {
            $i[$f] = trim((string) $d[$f]);
        }
    }
    $list[] = $i;
    return [$list, $i];
});

if ($item === null) {
    sendJson(409, ['errors' => ['ผลงานนี้ถูก Import ลงโปรไฟล์นี้แล้ว']]);
}
sendJson(201, $item);
