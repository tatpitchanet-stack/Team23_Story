// --- save info Profile ---
const profileForm = document.getElementById('portfolio-profile-form');

profileForm.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const profileData = {
        displayName: document.getElementById('displayName').value,
        whatIEnjoy: document.getElementById('whatIEnjoy').value,
        whatIVeTried: document.getElementById('whatIVeTried').value,
        whatImCuriousAbout: document.getElementById('whatImCuriousAbout').value
    };

    //save localStorage by key
    localStorage.setItem('portfolio_profile', JSON.stringify(profileData));
    alert('บันทึกข้อมูลโปรไฟล์สำเร็จ!');
});


// --- save info Portfolio Item ---
const itemForm = document.getElementById('portfolio-item-form');

itemForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const newItem = {
        title: document.getElementById('title').value,
        type: document.getElementById('type').value,
        date: document.getElementById('date').value,
        role: document.getElementById('role').value,
        description: document.getElementById('description').value,
        skills: document.getElementById('skills').value,
        reflection: {
            whatIdid: document.getElementById('whatIdid').value,
            whatIlearned: document.getElementById('whatIlearned').value,
            challenge: document.getElementById('challenge').value,
            nextStep: document.getElementById('nextStep').value
        },
        evidence: document.getElementById('evidence').value
    };

    // ดึงข้อมูลเก่าที่มีอยู่ออกมาก่อน (เพราะ Item อาจจะมีหลายชิ้น)
    let items = JSON.parse(localStorage.getItem('portfolio_items')) || [];
    
    // เติมชิ้นใหม่เข้าไปใน Array
    items.push(newItem);

    // เซฟกลับลง localStorage โดยใช้ Key แยก (ไม่ให้ปะปนกับ Profile)
    localStorage.setItem('portfolio_items', JSON.stringify(items));
    
    alert('บันทึกผลงานสำเร็จ!');
    itemForm.reset();
});