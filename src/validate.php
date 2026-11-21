<?php
// ฟังก์ชันตรวจข้อมูลที่ server (งานของคน 2: Validation + ความปลอดภัย)
// คืน array ของข้อความ error ถ้าว่าง [] แปลว่าข้อมูลผ่าน
// หลักการ: ไม่เชื่อข้อมูลจาก client แม้ frontend จะตรวจมาแล้ว
//   - ชนิดข้อมูลต้องตรง (string / array / object)
//   - ห้ามว่างหรือมีแต่ช่องว่าง
//   - จำกัดความยาว กันข้อมูลใหญ่เกินจนไฟล์ JSON บวม
//   - type ต้องเป็นค่าที่กำหนด, date ต้องเป็นวันที่จริง, evidence ต้องเป็น http/https

const LIMITS = [
    'short' => 100,        // ชื่อ, role, type, ชื่อทักษะ
    'title' => 150,
    'long' => 1000,        // ข้อความยาว (description, reflection, whatIEnjoy ...)
    'url' => 2000,
    'maxSkills' => 20,
    'maxEvidence' => 10
];

const ITEM_TYPES = ['Project', 'Activity', 'Certificate', 'Challenge'];

function isBlank($v) {
    return !is_string($v) || trim($v) === '';
}

// นับความยาวเป็นตัวอักษร (ไม่ใช่ไบต์) ภาษาไทยจะได้นับถูก
function textLength($v) {
    return mb_strlen(trim($v), 'UTF-8');
}

// ตัวอักษรควบคุม (ยกเว้น \t \n \r) ไม่ควรอยู่ในข้อความที่ผู้ใช้กรอก
function hasControlChars($v) {
    return preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $v) === 1;
}

// ตรวจช่องข้อความ 1 ช่อง: ต้องเป็น string, ไม่ว่าง, ไม่ยาวเกิน, ไม่มีอักขระควบคุม
function checkText(&$errors, $label, $value, $max) {
    if (isBlank($value)) {
        $errors[] = "กรุณากรอก $label";
        return false;
    }
    if (textLength($value) > $max) {
        $errors[] = "$label ต้องไม่เกิน $max ตัวอักษร";
        return false;
    }
    if (hasControlChars($value)) {
        $errors[] = "$label มีอักขระที่ไม่อนุญาต";
        return false;
    }
    return true;
}

function isHttpUrl($v) {
    if (!is_string($v)) {
        return false;
    }
    $s = trim($v);
    if ($s === '' || strlen($s) > LIMITS['url'] || preg_match('/\s/', $s) === 1) {
        return false;
    }
    $parts = parse_url($s);
    if ($parts === false || !isset($parts['scheme']) || !isset($parts['host'])) {
        return false;
    }
    return in_array(strtolower($parts['scheme']), ['http', 'https'], true) && $parts['host'] !== '';
}

// วันที่รูปแบบ YYYY-MM-DD และต้องเป็นวันที่ที่มีอยู่จริง (เช่น 2024-02-31 ไม่ผ่าน)
function isValidDate($v) {
    if (!is_string($v)) {
        return false;
    }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', trim($v), $m) !== 1) {
        return false;
    }
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

// object ใน JSON (ถอดเป็น array ที่มี key) ไม่ใช่ list เช่น [1,2]
function isPlainObject($v) {
    return is_array($v) && ($v === [] || !array_is_list($v));
}

function isList($v) {
    return is_array($v) && array_is_list($v);
}

function validateProfile($data) {
    if (!isPlainObject($data)) {
        return ['ข้อมูลโปรไฟล์ไม่ถูกต้อง'];
    }
    $errors = [];
    checkText($errors, 'displayName', $data['displayName'] ?? null, LIMITS['short']);
    checkText($errors, 'whatIEnjoy', $data['whatIEnjoy'] ?? null, LIMITS['long']);
    checkText($errors, 'whatIVeTried', $data['whatIVeTried'] ?? null, LIMITS['long']);
    checkText($errors, 'whatImCuriousAbout', $data['whatImCuriousAbout'] ?? null, LIMITS['long']);
    return $errors;
}

function validateItem($data) {
    if (!isPlainObject($data)) {
        return ['ข้อมูลผลงานไม่ถูกต้อง'];
    }
    $errors = [];

    checkText($errors, 'profileId', $data['profileId'] ?? null, LIMITS['short']);
    checkText($errors, 'title', $data['title'] ?? null, LIMITS['title']);
    checkText($errors, 'role', $data['role'] ?? null, LIMITS['short']);
    checkText($errors, 'description', $data['description'] ?? null, LIMITS['long']);

    // type ต้องเป็นหนึ่งใน Project / Activity / Certificate / Challenge
    $type = $data['type'] ?? null;
    if (isBlank($type)) {
        $errors[] = 'กรุณากรอก type';
    } elseif (!in_array(trim($type), ITEM_TYPES, true)) {
        $errors[] = 'type ต้องเป็น ' . implode(', ', ITEM_TYPES);
    }

    // date ต้องเป็น YYYY-MM-DD ที่มีอยู่จริง
    $date = $data['date'] ?? null;
    if (isBlank($date)) {
        $errors[] = 'กรุณากรอก date';
    } elseif (!isValidDate($date)) {
        $errors[] = 'date ต้องเป็นวันที่รูปแบบ YYYY-MM-DD ที่มีอยู่จริง';
    }

    // skills: array ของข้อความ อย่างน้อย 1 รายการ
    $skills = $data['skills'] ?? null;
    if (!isList($skills) || count($skills) === 0) {
        $errors[] = 'skills ต้องมีอย่างน้อย 1 รายการ';
    } elseif (count($skills) > LIMITS['maxSkills']) {
        $errors[] = 'skills ต้องไม่เกิน ' . LIMITS['maxSkills'] . ' รายการ';
    } else {
        foreach ($skills as $s) {
            if (isBlank($s) || textLength($s) > LIMITS['short'] || hasControlChars($s)) {
                $errors[] = 'skills แต่ละรายการต้องเป็นข้อความที่ไม่ว่าง และไม่เกิน ' . LIMITS['short'] . ' ตัวอักษร';
                break;
            }
        }
    }

    // reflection: ต้องเป็น object และมีครบ 4 ช่อง
    $r = $data['reflection'] ?? null;
    if (!isPlainObject($r)) {
        $errors[] = 'กรุณากรอก reflection';
    } else {
        checkText($errors, 'reflection.whatIDid', $r['whatIDid'] ?? null, LIMITS['long']);
        checkText($errors, 'reflection.whatILearned', $r['whatILearned'] ?? null, LIMITS['long']);
        checkText($errors, 'reflection.challenge', $r['challenge'] ?? null, LIMITS['long']);
        checkText($errors, 'reflection.nextStep', $r['nextStep'] ?? null, LIMITS['long']);
    }

    // evidence: array ของลิงก์ http/https อย่างน้อย 1 รายการ
    $evidence = $data['evidence'] ?? null;
    if (!isList($evidence) || count($evidence) === 0) {
        $errors[] = 'evidence ต้องมีอย่างน้อย 1 ลิงก์';
    } elseif (count($evidence) > LIMITS['maxEvidence']) {
        $errors[] = 'evidence ต้องไม่เกิน ' . LIMITS['maxEvidence'] . ' ลิงก์';
    } elseif (count(array_filter($evidence, 'isHttpUrl')) !== count($evidence)) {
        $errors[] = 'evidence ต้องเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://';
    }

    // ฟิลด์เสริมของ Challenge (ไม่บังคับ แต่ถ้ามีต้องถูกชนิด)
    foreach (['challengeId', 'hostGroup'] as $f) {
        if (isset($data[$f])) {
            checkText($errors, $f, $data[$f], LIMITS['short']);
        }
    }
    if (isset($data['category']) && !in_array($data['category'], ['discover', 'mix', 'levelup'], true)) {
        $errors[] = 'category ต้องเป็น discover, mix หรือ levelup';
    }
    if (isset($data['schemaVersion']) && $data['schemaVersion'] !== '1.0') {
        $errors[] = 'schemaVersion ต้องเป็น "1.0"';
    }

    return $errors;
}
