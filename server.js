const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { validateProfile, validateItem } = require('./validate');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');

app.use(express.json({ limit: '1mb' }));

// เสิร์ฟเฉพาะไฟล์หน้าเว็บ ไม่เสิร์ฟทั้งโฟลเดอร์ (กัน data/ และ server.js หลุดผ่าน URL)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/api.js', (req, res) => res.sendFile(path.join(__dirname, 'api.js')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

// ---------- อ่าน/เขียนไฟล์ JSON ----------

async function readList(file) {
    try {
        return JSON.parse(await fs.readFile(file, 'utf-8'));
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(DATA_DIR, { recursive: true });
            await fs.writeFile(file, '[]', 'utf-8');
            return [];
        }
        throw err;
    }
}

// คิวเขียนไฟล์: ทำทีละคำขอ ไม่ให้ 2 คำขออ่าน-เขียนทับกัน
let queue = Promise.resolve();
function exclusive(task) {
    const run = queue.then(task);
    queue = run.catch(() => {});
    return run;
}

// เขียนลงไฟล์ชั่วคราวก่อนแล้วค่อย rename กันไฟล์เสียถ้าพังกลางทาง
async function writeList(file, list) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(list, null, 2), 'utf-8');
    await fs.rename(tmp, file);
}

// ---------- สร้าง id ฝั่ง server (string) ----------

let lastId = 0;
function nextId() {
    lastId = Math.max(Date.now(), lastId + 1);
    return String(lastId);
}

// ---------- API ----------

const bad = (res, errors) => res.status(400).json({ errors });

// GET /api/profiles
app.get('/api/profiles', async (req, res, next) => {
    try {
        res.status(200).json(await readList(PROFILES_FILE));
    } catch (err) { next(err); }
});

// POST /api/profiles
app.post('/api/profiles', async (req, res, next) => {
    try {
        const errors = validateProfile(req.body);
        if (errors.length) return bad(res, errors);
        const { displayName, whatIEnjoy, whatIVeTried, whatImCuriousAbout } = req.body;
        const profile = await exclusive(async () => {
            const list = await readList(PROFILES_FILE);
            const p = {
                id: nextId(),
                displayName: displayName.trim(),
                whatIEnjoy: whatIEnjoy.trim(),
                whatIVeTried: whatIVeTried.trim(),
                whatImCuriousAbout: whatImCuriousAbout.trim()
            };
            list.push(p);
            await writeList(PROFILES_FILE, list);
            return p;
        });
        res.status(201).json(profile);
    } catch (err) { next(err); }
});

// GET /api/items  (?profileId= กรองเฉพาะโปรไฟล์นั้น)
app.get('/api/items', async (req, res, next) => {
    try {
        const items = await readList(ITEMS_FILE);
        const { profileId } = req.query;
        res.status(200).json(
            profileId === undefined ? items : items.filter(i => String(i.profileId) === String(profileId))
        );
    } catch (err) { next(err); }
});

// POST /api/items
app.post('/api/items', async (req, res, next) => {
    try {
        const errors = validateItem(req.body);
        if (errors.length) return bad(res, errors);
        const d = req.body;
        const result = await exclusive(async () => {
            const profiles = await readList(PROFILES_FILE);
            if (!profiles.some(p => String(p.id) === String(d.profileId))) return null;
            const items = await readList(ITEMS_FILE);
            const item = {
                id: 'item' + nextId(),
                profileId: String(d.profileId),
                title: d.title.trim(),
                type: d.type.trim(),
                date: d.date.trim(),
                role: d.role.trim(),
                description: d.description.trim(),
                skills: d.skills.map(s => s.trim()),
                reflection: {
                    whatIDid: d.reflection.whatIDid.trim(),
                    whatILearned: d.reflection.whatILearned.trim(),
                    challenge: d.reflection.challenge.trim(),
                    nextStep: d.reflection.nextStep.trim()
                },
                evidence: d.evidence.map(e => e.trim())
            };
            items.push(item);
            await writeList(ITEMS_FILE, items);
            return item;
        });
        if (!result) return bad(res, ['ไม่พบโปรไฟล์เจ้าของผลงาน']);
        res.status(201).json(result);
    } catch (err) { next(err); }
});

// JSON ที่พัง (body ไม่ใช่ JSON) -> 400, อย่างอื่น -> 500
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return bad(res, ['รูปแบบ JSON ไม่ถูกต้อง']);
    console.error(err);
    res.status(500).json({ errors: ['เกิดข้อผิดพลาดที่ server'] });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
