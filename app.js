// ===== VALIDATION HELPERS =====

// อ่านชื่อ label ของช่องกรอก (ตัดเลขข้อและเครื่องหมาย * ออก) เพื่อใช้ในข้อความแจ้งเตือน
function fieldLabel(id) {
    const label = document.querySelector('label[for="' + id + '"]');
    if (!label) return id;
    return label.textContent
        .replace(/\*/g, '')
        .replace(/^\s*\d+\.\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// คืนรายการ id ของช่องที่ว่าง (หลังตัดช่องว่างหน้า-หลังแล้ว) ช่องที่มีแต่ space ถือว่าว่าง
function findEmptyFields(ids) {
    return ids.filter(id => document.getElementById(id).value.trim() === '');
}

// แจ้งเตือนว่ายังมีช่องไหนที่ต้องกรอก แล้วย้าย cursor ไปที่ช่องแรกที่ว่าง
function showMissingFields(ids) {
    alert(
        'กรุณากรอกข้อมูลให้ครบ (ห้ามเว้นว่างหรือพิมพ์แค่ช่องว่าง)\n- ' +
        ids.map(fieldLabel).join('\n- ')
    );
    document.getElementById(ids[0]).focus();
}

// ตรวจว่าเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https:// เท่านั้น
function isHttpUrl(text) {
    try {
        const url = new URL(text);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
        return false;
    }
}

// แสดงข้อความ error ในกล่องข้อความของฟอร์ม (ใช้ textContent ไม่ใช้ innerHTML)
function showFormMessage(id, messages) {
    const box = document.getElementById(id);
    if (box) box.textContent = messages.join('\n');
}

// แปลง error ที่ได้จาก api.js ให้เป็นรายการข้อความ (ถ้าไม่ใช่ ApiError ถือว่าติดต่อ server ไม่ได้)
function errorMessages(err) {
    if (err && Array.isArray(err.errors) && err.errors.length > 0) return err.errors;
    return ['ติดต่อ server ไม่ได้ กรุณาลองใหม่อีกครั้ง'];
}

document.addEventListener('DOMContentLoaded', function () {

    // --- ส่วนที่ 0: โหลดรายชื่อโปรไฟล์ใส่ลงใน Dropdown ของฟอร์มผลงาน ---
    async function loadProfilesToDropdown() {
        const profileSelect = document.getElementById('profileSelect');
        if (!profileSelect) return;

        // เคลียร์ option เก่า (เหลือไว้แค่ตัวเลือกแรก)
        profileSelect.innerHTML = '<option value="">-- เลือกโปรไฟล์ --</option>';

        // ดึงข้อมูลโปรไฟล์จาก LocalStorage
        let profiles = [];
        try {
            profiles = await getProfiles();
        } catch (err) {
            showFormMessage('item-form-message', errorMessages(err));
            return;
        }

        // วนลูปสร้าง <option> ให้เลือก
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id; // ใช้ ID เป็น Value
            option.textContent = profile.displayName; // แสดงชื่อ Display Name
            profileSelect.appendChild(option);
        });
    }

    // เรียกใช้งานฟังก์ชันโหลดตอนเปิดหน้าเว็บ
    loadProfilesToDropdown();


    // --- ส่วนที่ 1: บันทึกข้อมูล Profile (หลายโปรไฟล์) ---
    const profileForm = document.getElementById('portfolio-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // ตรวจว่าทุกช่องมีข้อความจริง (ไม่ว่าง และไม่ใช่แค่ช่องว่าง)
            const emptyFields = findEmptyFields(['displayName', 'whatIEnjoy', 'whatIVeTried', 'whatImCuriousAbout']);
            if (emptyFields.length > 0) {
                showMissingFields(emptyFields);
                return;
            }

            // id ให้ api.js (ต่อไปคือ server) เป็นคนสร้าง
            const profileData = {
                displayName: document.getElementById('displayName').value.trim(),
                whatIEnjoy: document.getElementById('whatIEnjoy').value.trim(),
                whatIVeTried: document.getElementById('whatIVeTried').value.trim(),
                whatImCuriousAbout: document.getElementById('whatImCuriousAbout').value.trim()
            };

            showFormMessage('profile-form-message', []);
            let savedProfile;
            try {
                savedProfile = await createProfile(profileData);
            } catch (err) {
                // ข้อมูลที่กรอกไว้ยังอยู่ในฟอร์ม แสดงแค่ข้อความ error
                showFormMessage('profile-form-message', errorMessages(err));
                return;
            }

            alert('สร้างและบันทึกโปรไฟล์สำเร็จ!');
            profileForm.reset();

            // อัปเดตรายชื่อใน Dropdown และรายการ Portfolio บนหน้าเว็บทันทีหลังสร้างโปรไฟล์ใหม่เสร็จ
            await loadProfilesToDropdown();
            await displayPortfolio();

            // เลือกโปรไฟล์ที่เพิ่งสร้างไว้ให้เลย แล้วเลื่อนไปที่ฟอร์มเพิ่มผลงานอัตโนมัติ
            document.getElementById('profileSelect').value = savedProfile.id;
            const itemSection = document.getElementById('add-portfolio-item');
            if (itemSection) {
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                itemSection.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
            }
        });
    }


    // --- ส่วนที่ 2: บันทึกข้อมูล Portfolio Item (ผูกกับ Profile ID ที่เลือก) ---
    const itemForm = document.getElementById('portfolio-item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // ต้องเลือกโปรไฟล์เจ้าของผลงานก่อนเสมอ
            const selectedProfileId = document.getElementById('profileSelect').value;
            if (!selectedProfileId) {
                alert('กรุณาเลือกโปรไฟล์เจ้าของผลงานก่อนบันทึก');
                document.getElementById('profileSelect').focus();
                return;
            }

            // ตรวจว่าทุกช่องมีข้อความจริง (ไม่ว่าง และไม่ใช่แค่ช่องว่าง)
            const emptyFields = findEmptyFields([
                'title', 'type', 'date', 'role', 'description', 'skills',
                'whatIDid', 'whatILearned', 'challenge', 'nextStep', 'evidence'
            ]);
            if (emptyFields.length > 0) {
                showMissingFields(emptyFields);
                return;
            }

            // แปลง skills จากข้อความคั่นด้วยคอมมา (เช่น "HTML, CSS") ให้เป็น Array ตาม JSON Contract
            // กรองค่าว่างทิ้ง เช่น "HTML,,CSS" จะไม่มีค่าว่างใน Array
            const skillsArray = document.getElementById('skills').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s !== '');
            if (skillsArray.length === 0) {
                alert('กรุณากรอก Skills อย่างน้อย 1 รายการ (คั่นด้วยคอมมา เช่น HTML, CSS)');
                document.getElementById('skills').focus();
                return;
            }

            // Evidence ต้องเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://
            const evidenceInput = document.getElementById('evidence').value.trim();
            if (!isHttpUrl(evidenceInput)) {
                alert('ลิงก์หลักฐาน (Evidence) ไม่ถูกต้อง ต้องขึ้นต้นด้วย http:// หรือ https:// เช่น https://example.com/my-work');
                document.getElementById('evidence').focus();
                return;
            }
            // แปลง evidence เป็น Array ของลิงก์ตาม JSON Contract
            const evidenceArray = [evidenceInput];

            // id ให้ api.js (ต่อไปคือ server) เป็นคนสร้าง
            const newItem = {
                profileId: selectedProfileId,
                title: document.getElementById('title').value.trim(),
                type: document.getElementById('type').value,
                date: document.getElementById('date').value,
                role: document.getElementById('role').value.trim(),
                description: document.getElementById('description').value.trim(),
                skills: skillsArray,
                reflection: {
                    whatIDid: document.getElementById('whatIDid').value.trim(),
                    whatILearned: document.getElementById('whatILearned').value.trim(),
                    challenge: document.getElementById('challenge').value.trim(),
                    nextStep: document.getElementById('nextStep').value.trim()
                },
                evidence: evidenceArray
            };

            showFormMessage('item-form-message', []);
            try {
                await createItem(newItem);
            } catch (err) {
                // ข้อมูลที่กรอกไว้ยังอยู่ในฟอร์ม แสดงแค่ข้อความ error
                showFormMessage('item-form-message', errorMessages(err));
                return;
            }

            alert("Portfolio Item saved!");
            itemForm.reset();

            // แสดง Portfolio Item ที่เพิ่งบันทึกบนหน้าเว็บทันที
            await displayPortfolio();
        });
    }
});

// ===== DISPLAY PORTFOLIO =====

async function displayPortfolio() {
    const portfolioList = document.getElementById('portfolio-list');

    if (!portfolioList) return;

    // แสดงสถานะระหว่างรอข้อมูล
    portfolioList.textContent = '';
    const status = document.createElement('p');
    status.className = 'col-12 text-center';
    status.textContent = 'กำลังโหลด...';
    portfolioList.appendChild(status);

    let profiles, items;
    try {
        profiles = await getProfiles();
        items = await getItems();
    } catch (err) {
        status.textContent = errorMessages(err).join(' ');
        return;
    }

    portfolioList.textContent = '';

    profiles.forEach((profile, index) => {

        const profileItems = items.filter(
            item => String(item.profileId) === String(profile.id)
        );

        const card = document.createElement('div');
        card.className = 'portfolio-card';

        const name = document.createElement('h3');
        name.textContent = profile.displayName;

        const enjoy = document.createElement('p');
        enjoy.textContent = 'What I Enjoy: ' + profile.whatIEnjoy;

        const tried = document.createElement('p');
        tried.textContent = 'What I Have Tried: ' + profile.whatIVeTried;

        const curious = document.createElement('p');
        curious.textContent =
            'What I Am Curious About: ' + profile.whatImCuriousAbout;

        const itemHeading = document.createElement('h4');
        itemHeading.textContent = 'My Portfolio Items';

        const no = document.createElement('span');
        no.className = 'card-no';
        no.textContent = String(index + 1).padStart(2, '0');


        const meta = document.createElement('p');
        meta.className = 'card-meta';
        meta.textContent = profileItems.length + (profileItems.length === 1 ? ' portfolio item' : ' portfolio items');

        card.append(no, name, meta, enjoy, tried, curious, itemHeading);

        profileItems.forEach(item => {

            const itemCard = document.createElement('div');
            itemCard.className = 'portfolio-item';

            const title = document.createElement('h5');
            title.textContent = item.title;

            const type = document.createElement('p');
            type.textContent = 'Type: ' + item.type;

            const date = document.createElement('p');
            date.textContent = 'Date: ' + item.date;

            const role = document.createElement('p');
            role.textContent = 'Role: ' + item.role;

            const description = document.createElement('p');
            description.textContent = item.description;

            const skills = document.createElement('p');
            skills.textContent = 'Skills: ' +
                (Array.isArray(item.skills)
                    ? item.skills.join(', ')
                    : item.skills);

            const reflection = item.reflection || {};

            const whatIDid = document.createElement('p');
            whatIDid.textContent =
                'What I Did: ' + (reflection.whatIDid || '');

            const whatILearned = document.createElement('p');
            whatILearned.textContent =
                'What I Learned: ' + (reflection.whatILearned || '');

            const challenge = document.createElement('p');
            challenge.textContent =
                'Challenge: ' + (reflection.challenge || '');

            const nextStep = document.createElement('p');
            nextStep.textContent =
                'Next Step: ' + (reflection.nextStep || '');

            itemCard.append(
                title,
                type,
                date,
                role,
                description,
                skills,
                whatIDid,
                whatILearned,
                challenge,
                nextStep
            );

            if (Array.isArray(item.evidence)) {
                item.evidence.forEach(url => {
                    const link = document.createElement('a');

                    link.href = url;
                    link.textContent = 'View Evidence';
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';

                    itemCard.appendChild(link);
                });
            }

            card.appendChild(itemCard);
        });

        // Bootstrap grid: 1 column on phones, 2 on tablets, 3 on large screens
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-xl-4';
        col.appendChild(card);
        portfolioList.appendChild(col);
    });
}

// Display saved portfolios when the page loads
document.addEventListener('DOMContentLoaded', displayPortfolio);