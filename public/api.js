// ===== API LAYER =====
// ทุกฟังก์ชันเป็น async และเรียก server (PHP) ด้วย fetch ไปที่ /api/profiles.php และ /api/items.php
// ต้องเปิดหน้าเว็บผ่าน server (php -S localhost:3000 -t public) ไม่ใช่เปิดไฟล์ index.html ตรงๆ
// ส่วนอื่นของหน้าเว็บ (app.js) ไม่ต้องแก้

// error ที่ app.js นำไปแสดง: errors คือรายการข้อความ (เหมือน {"errors": [...]} จาก server)
class ApiError extends Error {
    constructor(errors) {
        super(errors.join('\n'));
        this.name = 'ApiError';
        this.errors = errors;
    }
}

// ส่งคำขอไป server แล้วคืนข้อมูล JSON ที่ตอบกลับ
// - 400/404/409 + {"errors": [...]}  → โยน ApiError(errors) ให้ app.js แสดงข้อความ
// - status อื่นที่ไม่สำเร็จ     → โยน ApiError ข้อความทั่วไป
// - ติดต่อ server ไม่ได้        → fetch โยน TypeError เอง app.js จะแสดงว่า "ติดต่อ server ไม่ได้"
async function request(method, path, body) {
    const options = { method, headers: { 'Accept': 'application/json' } };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);

    let data = null;
    try {
        data = await response.json();
    } catch (err) {
        data = null;
    }

    if (!response.ok) {
        if ((response.status === 400 || response.status === 404 || response.status === 409) && data && Array.isArray(data.errors) && data.errors.length > 0) {
            throw new ApiError(data.errors);
        }
        throw new ApiError(['server ตอบกลับผิดพลาด (' + response.status + ') กรุณาลองใหม่อีกครั้ง']);
    }
    return data;
}

// GET /api/profiles
async function getProfiles() {
    return request('GET', '/api/profiles.php');
}

// POST /api/profiles  (id ให้ server สร้าง)
async function createProfile(data) {
    return request('POST', '/api/profiles.php', data);
}

// GET /api/items  (profileId ไม่บังคับ ถ้าใส่จะได้เฉพาะผลงานของโปรไฟล์นั้น)
async function getItems(profileId) {
    const query = profileId === undefined ? '' : '?profileId=' + encodeURIComponent(profileId);
    return request('GET', '/api/items.php' + query);
}

// POST /api/items  (id ให้ server สร้าง, profileId ต้องมีอยู่จริง)
async function createItem(data) {
    return request('POST', '/api/items.php', data);
}

// DELETE /api/items?id=...  (ลบผลงานตาม id)
async function deleteItem(id) {
    return request('DELETE', '/api/items.php?id=' + encodeURIComponent(id));
}