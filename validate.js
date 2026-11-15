// ฟังก์ชันตรวจข้อมูลที่ server (งานของคน 2: Validation + ความปลอดภัย)
// คืน array ของข้อความ error ถ้าว่าง [] แปลว่าข้อมูลผ่าน
// หลักการ: ไม่เชื่อข้อมูลจาก client แม้ frontend จะตรวจมาแล้ว
//   - ชนิดข้อมูลต้องตรง (string / array / object)
//   - ห้ามว่างหรือมีแต่ช่องว่าง
//   - จำกัดความยาว กันข้อมูลใหญ่เกินจนไฟล์ JSON บวม
//   - type ต้องเป็นค่าที่กำหนด, date ต้องเป็นวันที่จริง, evidence ต้องเป็น http/https

const LIMITS = {
    short: 100,        // ชื่อ, role, type, ชื่อทักษะ
    title: 150,
    long: 1000,        // ข้อความยาว (description, reflection, whatIEnjoy ...)
    url: 2000,
    maxSkills: 20,
    maxEvidence: 10
};

const ITEM_TYPES = ['Project', 'Activity', 'Certificate'];

function isBlank(v) {
    return typeof v !== 'string' || v.trim() === '';
}

// ตัวอักษรควบคุม (ยกเว้น \t \n \r) ไม่ควรอยู่ในข้อความที่ผู้ใช้กรอก
function hasControlChars(v) {
    return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v);
}

// ตรวจช่องข้อความ 1 ช่อง: ต้องเป็น string, ไม่ว่าง, ไม่ยาวเกิน, ไม่มีอักขระควบคุม
function checkText(errors, label, value, max) {
    if (isBlank(value)) {
        errors.push(`กรุณากรอก ${label}`);
        return false;
    }
    if (value.trim().length > max) {
        errors.push(`${label} ต้องไม่เกิน ${max} ตัวอักษร`);
        return false;
    }
    if (hasControlChars(value)) {
        errors.push(`${label} มีอักขระที่ไม่อนุญาต`);
        return false;
    }
    return true;
}

function isHttpUrl(v) {
    if (typeof v !== 'string') return false;
    const s = v.trim();
    if (s === '' || s.length > LIMITS.url || /\s/.test(s)) return false;
    try {
        const u = new URL(s);
        return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname !== '';
    } catch (err) {
        return false;
    }
}

// วันที่รูปแบบ YYYY-MM-DD และต้องเป็นวันที่ที่มีอยู่จริง (เช่น 2024-02-31 ไม่ผ่าน)
function isValidDate(v) {
    if (typeof v !== 'string') return false;
    const s = v.trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function validateProfile(data) {
    if (!isPlainObject(data)) return ['ข้อมูลโปรไฟล์ไม่ถูกต้อง'];
    const errors = [];
    checkText(errors, 'displayName', data.displayName, LIMITS.short);
    checkText(errors, 'whatIEnjoy', data.whatIEnjoy, LIMITS.long);
    checkText(errors, 'whatIVeTried', data.whatIVeTried, LIMITS.long);
    checkText(errors, 'whatImCuriousAbout', data.whatImCuriousAbout, LIMITS.long);
    return errors;
}

function validateItem(data) {
    if (!isPlainObject(data)) return ['ข้อมูลผลงานไม่ถูกต้อง'];
    const errors = [];

    checkText(errors, 'profileId', data.profileId, LIMITS.short);
    checkText(errors, 'title', data.title, LIMITS.title);
    checkText(errors, 'role', data.role, LIMITS.short);
    checkText(errors, 'description', data.description, LIMITS.long);

    // type ต้องเป็นหนึ่งใน Project / Activity / Certificate
    if (isBlank(data.type)) {
        errors.push('กรุณากรอก type');
    } else if (!ITEM_TYPES.includes(data.type.trim())) {
        errors.push(`type ต้องเป็น ${ITEM_TYPES.join(', ')}`);
    }

    // date ต้องเป็น YYYY-MM-DD ที่มีอยู่จริง
    if (isBlank(data.date)) {
        errors.push('กรุณากรอก date');
    } else if (!isValidDate(data.date)) {
        errors.push('date ต้องเป็นวันที่รูปแบบ YYYY-MM-DD ที่มีอยู่จริง');
    }

    // skills: array ของข้อความ อย่างน้อย 1 รายการ
    if (!Array.isArray(data.skills) || data.skills.length === 0) {
        errors.push('skills ต้องมีอย่างน้อย 1 รายการ');
    } else if (data.skills.length > LIMITS.maxSkills) {
        errors.push(`skills ต้องไม่เกิน ${LIMITS.maxSkills} รายการ`);
    } else if (data.skills.some(s => isBlank(s) || s.trim().length > LIMITS.short || hasControlChars(s))) {
        errors.push(`skills แต่ละรายการต้องเป็นข้อความที่ไม่ว่าง และไม่เกิน ${LIMITS.short} ตัวอักษร`);
    }

    // reflection: ต้องเป็น object และมีครบ 4 ช่อง
    if (!isPlainObject(data.reflection)) {
        errors.push('กรุณากรอก reflection');
    } else {
        const r = data.reflection;
        checkText(errors, 'reflection.whatIDid', r.whatIDid, LIMITS.long);
        checkText(errors, 'reflection.whatILearned', r.whatILearned, LIMITS.long);
        checkText(errors, 'reflection.challenge', r.challenge, LIMITS.long);
        checkText(errors, 'reflection.nextStep', r.nextStep, LIMITS.long);
    }

    // evidence: array ของลิงก์ http/https อย่างน้อย 1 รายการ
    if (!Array.isArray(data.evidence) || data.evidence.length === 0) {
        errors.push('evidence ต้องมีอย่างน้อย 1 ลิงก์');
    } else if (data.evidence.length > LIMITS.maxEvidence) {
        errors.push(`evidence ต้องไม่เกิน ${LIMITS.maxEvidence} ลิงก์`);
    } else if (!data.evidence.every(isHttpUrl)) {
        errors.push('evidence ต้องเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://');
    }

    return errors;
}

module.exports = { validateProfile, validateItem };