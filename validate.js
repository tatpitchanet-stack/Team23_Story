// ฟังก์ชันตรวจข้อมูลก่อนบันทึก (งานของคน 2 - ไฟล์นี้เป็นเวอร์ชันเริ่มต้นให้ server ใช้งานได้ก่อน)
// คืน array ของข้อความ error ถ้าว่าง [] แปลว่าข้อมูลผ่าน

function isBlank(v) {
    return typeof v !== 'string' || v.trim() === '';
}

function isHttpUrl(v) {
    return typeof v === 'string' && /^https?:\/\/\S+$/i.test(v.trim());
}

function validateProfile(data) {
    const errors = [];
    if (!data || typeof data !== 'object') return ['ข้อมูลโปรไฟล์ไม่ถูกต้อง'];
    ['displayName', 'whatIEnjoy', 'whatIVeTried', 'whatImCuriousAbout'].forEach(f => {
        if (isBlank(data[f])) errors.push(`กรุณากรอก ${f}`);
    });
    return errors;
}

function validateItem(data) {
    const errors = [];
    if (!data || typeof data !== 'object') return ['ข้อมูลผลงานไม่ถูกต้อง'];
    ['profileId', 'title', 'type', 'date', 'role', 'description'].forEach(f => {
        if (isBlank(data[f])) errors.push(`กรุณากรอก ${f}`);
    });
    if (!Array.isArray(data.skills) || data.skills.length === 0 || data.skills.some(isBlank)) {
        errors.push('skills ต้องมีอย่างน้อย 1 รายการ');
    }
    const r = data.reflection;
    ['whatIDid', 'whatILearned', 'challenge', 'nextStep'].forEach(f => {
        if (!r || isBlank(r[f])) errors.push(`กรุณากรอก reflection.${f}`);
    });
    if (!Array.isArray(data.evidence) || data.evidence.length === 0 || !data.evidence.every(isHttpUrl)) {
        errors.push('evidence ต้องเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://');
    }
    return errors;
}

module.exports = { validateProfile, validateItem };
