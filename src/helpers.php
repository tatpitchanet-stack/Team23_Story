<?php
// ฟังก์ชันกลางที่ทุกไฟล์ใน public/api/ ใช้ร่วมกัน
// ไฟล์ในโฟลเดอร์ src/ และ data/ อยู่นอก public/ เลย เปิดผ่าน URL ไม่ได้

require __DIR__ . '/validate.php';

// โฟลเดอร์เก็บข้อมูล (นอก public/) เปลี่ยนได้ด้วย environment variable DATA_DIR
define('DATA_DIR', getenv('DATA_DIR') ?: dirname(__DIR__) . '/data');
define('PROFILES_FILE', DATA_DIR . '/profiles.json');
define('ITEMS_FILE', DATA_DIR . '/items.json');

// ---------- ตอบกลับ ----------

function sendJson($status, $data) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function badRequest($errors) {
    sendJson(400, ['errors' => $errors]);
}

// ถ้ามีอะไรพังที่ไม่ได้คาดไว้ ตอบ 500 (ไม่โชว์รายละเอียดให้ผู้ใช้)
set_exception_handler(function ($e) {
    error_log($e->getMessage());
    sendJson(500, ['errors' => ['เกิดข้อผิดพลาดที่ server']]);
});

// ---------- รับคำขอ ----------

function requireMethod(...$allowed) {
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        sendJson(405, ['errors' => ['ไม่รองรับ method นี้']]);
    }
}

// อ่าน body ที่เป็น JSON ถ้าไม่ใช่ JSON ตอบ 400
function readJsonBody() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        badRequest(['รูปแบบ JSON ไม่ถูกต้อง']);
    }
    return $data;
}

// ---------- อ่าน/เขียนไฟล์ JSON ----------

function readList($file) {
    if (!file_exists($file)) {
        return [];
    }
    $list = json_decode(file_get_contents($file), true);
    if (!is_array($list)) {
        throw new Exception("อ่าน $file ไม่ได้");
    }
    return $list;
}

// อ่าน-แก้-เขียน ทีละคำขอ: ล็อกไฟล์ด้วย flock กัน 2 คำขอเขียนทับกัน
// $change รับ list เดิม แล้วคืน [list ใหม่, ค่าที่จะส่งกลับ]
function updateList($file, $change) {
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0750, true);
    }
    $lock = fopen($file . '.lock', 'c');
    flock($lock, LOCK_EX);
    try {
        [$list, $result] = $change(readList($file));
        // เขียนลงไฟล์ชั่วคราวก่อนแล้วค่อย rename กันไฟล์เสียถ้าพังกลางทาง
        $tmp = $file . '.tmp';
        file_put_contents($tmp, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        rename($tmp, $file);
        return $result;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

// ---------- สร้าง id ฝั่ง server (string) ----------

function nextId($list) {
    $id = (int) (microtime(true) * 1000);
    $used = array_map(function ($x) { return str_replace('item', '', (string) $x['id']); }, $list);
    while (in_array((string) $id, $used, true)) {
        $id++;
    }
    return (string) $id;
}
