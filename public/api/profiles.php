<?php
// GET /api/profiles.php  → รายการโปรไฟล์ทั้งหมด (200)
// POST /api/profiles.php → สร้างโปรไฟล์ (201) หรือ 400 {"errors": [...]}
require __DIR__ . '/../../src/helpers.php';

requireMethod('GET', 'POST');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    sendJson(200, readList(PROFILES_FILE));
}

$data = readJsonBody();
$errors = validateProfile($data);
if (count($errors) > 0) {
    badRequest($errors);
}

$profile = updateList(PROFILES_FILE, function ($list) use ($data) {
    $p = [
        'id' => nextId($list),
        'displayName' => trim($data['displayName']),
        'whatIEnjoy' => trim($data['whatIEnjoy']),
        'whatIVeTried' => trim($data['whatIVeTried']),
        'whatImCuriousAbout' => trim($data['whatImCuriousAbout'])
    ];
    $list[] = $p;
    return [$list, $p];
});
sendJson(201, $profile);
