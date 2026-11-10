// ===== API LAYER =====
// ทุกฟังก์ชันเป็น async และคืนข้อมูลรูปแบบเดียวกับที่ server จะตอบ
// ตอนนี้ใช้ localStorage แทน server ไปก่อน (Issue #8)
// พอ server พร้อม (Issue #9) ให้แก้เฉพาะข้างในฟังก์ชันเหล่านี้เป็น fetch('/api/...')
// ส่วนอื่นของหน้าเว็บ (app.js) ไม่ต้องแก้

const PROFILES_KEY = 'portfolio_profiles';
const ITEMS_KEY = 'portfolio_items';

// error ที่ app.js นำไปแสดง: errors คือรายการข้อความ (เหมือน {"errors": [...]} จาก server)
class ApiError extends Error {
    constructor(errors) {
        super(errors.join('\n'));
        this.name = 'ApiError';
        this.errors = errors;
    }
}

function readList(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (err) {
        throw new ApiError(['อ่านข้อมูลไม่สำเร็จ']);
    }
}

function writeList(key, list) {
    try {
        localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
        throw new ApiError(['บันทึกข้อมูลไม่สำเร็จ']);
    }
}

// GET /api/profiles
async function getProfiles() {
    return readList(PROFILES_KEY);
}

// POST /api/profiles  (id สร้างที่นี่เหมือนที่ server จะสร้างให้ เก็บเป็น string)
async function createProfile(data) {
    const profile = Object.assign({ id: String(Date.now()) }, data);
    const profiles = readList(PROFILES_KEY);
    profiles.push(profile);
    writeList(PROFILES_KEY, profiles);
    return profile;
}

// GET /api/items  (profileId ไม่บังคับ ถ้าใส่จะได้เฉพาะผลงานของโปรไฟล์นั้น)
async function getItems(profileId) {
    const items = readList(ITEMS_KEY);
    if (profileId === undefined) return items;
    return items.filter(item => String(item.profileId) === String(profileId));
}

// POST /api/items  (profileId ต้องมีอยู่จริง ไม่เช่นนั้นถือว่าข้อมูลผิด)
async function createItem(data) {
    const profiles = readList(PROFILES_KEY);
    if (!profiles.some(p => String(p.id) === String(data.profileId))) {
        throw new ApiError(['ไม่พบโปรไฟล์เจ้าของผลงาน']);
    }
    const item = Object.assign({ id: 'item' + Date.now() }, data);
    const items = readList(ITEMS_KEY);
    items.push(item);
    writeList(ITEMS_KEY, items);
    return item;
}
