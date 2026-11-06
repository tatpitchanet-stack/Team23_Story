document.addEventListener('DOMContentLoaded', function () {

    // --- ส่วนที่ 0: โหลดรายชื่อโปรไฟล์ใส่ลงใน Dropdown ของฟอร์มผลงาน ---
    function loadProfilesToDropdown() {
        const profileSelect = document.getElementById('profileSelect');
        if (!profileSelect) return;

        // เคลียร์ option เก่า (เหลือไว้แค่ตัวเลือกแรก)
        profileSelect.innerHTML = '<option value="">-- เลือกโปรไฟล์ --</option>';

        // ดึงข้อมูลโปรไฟล์จาก LocalStorage
        let profiles = JSON.parse(localStorage.getItem('portfolio_profiles')) || [];

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
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const profileData = {
                id: Date.now(), // ใช้ timestamp เป็น ID ไม่ซ้ำกัน
                displayName: document.getElementById('displayName').value,
                whatIEnjoy: document.getElementById('whatIEnjoy').value,
                whatIVeTried: document.getElementById('whatIVeTried').value,
                whatImCuriousAbout: document.getElementById('whatImCuriousAbout').value
            };

            let profiles = JSON.parse(localStorage.getItem('portfolio_profiles')) || [];
            profiles.push(profileData);
            localStorage.setItem('portfolio_profiles', JSON.stringify(profiles));
            
            alert('สร้างและบันทึกโปรไฟล์สำเร็จ!');
            profileForm.reset();
            
            // อัปเดตรายชื่อใน Dropdown ทันทีหลังสร้างโปรไฟล์ใหม่เสร็จ
            loadProfilesToDropdown();
        });
    }


    // --- ส่วนที่ 2: บันทึกข้อมูล Portfolio Item (ผูกกับ Profile ID ที่เลือก) ---
    const itemForm = document.getElementById('portfolio-item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const selectedProfileId = document.getElementById('profileSelect').value;
            
            // แปลง skills จากข้อความคั่นด้วยคอมมา (เช่น "HTML, CSS") ให้เป็น Array ตาม JSON Contract
            const skillsInput = document.getElementById('skills').value;
            const skillsArray = skillsInput ? skillsInput.split(',').map(s => s.trim()) : [];

            // แปลง evidence เป็น Array ของลิงก์ตาม JSON Contract
            const evidenceInput = document.getElementById('evidence').value;
            const evidenceArray = evidenceInput ? [evidenceInput] : [];

            const newItem = {
                id: "item" + Date.now(),
                profileId: selectedProfileId,
                title: document.getElementById('title').value,
                type: document.getElementById('type').value,
                date: document.getElementById('date').value,
                role: document.getElementById('role').value,
                description: document.getElementById('description').value,
                skills: skillsArray,
                reflection: {
                    whatIDid: document.getElementById('whatIDid').value,
                    whatILearned: document.getElementById('whatILearned').value,
                    challenge: document.getElementById('challenge').value,
                    nextStep: document.getElementById('nextStep').value
                },
                evidence: evidenceArray
            };

            let items = JSON.parse(localStorage.getItem('portfolio_items')) || [];
            items.push(newItem);
            localStorage.setItem('portfolio_items', JSON.stringify(items));
            
            alert("Portfolio Item saved!");
            itemForm.reset();
        });
    }
});