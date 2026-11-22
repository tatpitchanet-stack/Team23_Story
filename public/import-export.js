// ===== IMPORT / EXPORT =====

// เก็บข้อมูล JSON ที่ Import ไว้ชั่วคราว
// เพื่อให้ app.js นำฟิลด์เสริมไปบันทึกพร้อม Portfolio Item
window.pendingImportedItem = null;

document.addEventListener('DOMContentLoaded', function () {

    // ===== ELEMENTS =====
    const importButton = document.getElementById('import-challenge-button');
    const importInput = document.getElementById('importJson');
    const importMessage = document.getElementById('import-message');
    const importProfileSelect = document.getElementById('importProfileSelect');

    const exportProfileSelect = document.getElementById('exportProfileSelect');
    const exportButton = document.getElementById('export-portfolio-button');
    const exportMessage = document.getElementById('export-message');

    // ===== HELPERS =====
    function showMessage(element, message, error = false) {
        if (!element) return;

        element.textContent = message;
        element.style.color = error ? '#b73a2f' : '#198754';
    }

    function isObject(value) {
        return value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value);
    }

    function isHttpUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' ||
                url.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    function isRealDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (!match) {
            return false;
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        // ใช้ UTC ทั้งหมด กันปัญหาเขตเวลา (เช่น ไทย UTC+7 ทำให้วันที่เลื่อนไป 1 วัน)
        const date = new Date(Date.UTC(year, month - 1, day));

        return date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day;
    }

    function validateImportedItem(item) {
        if (!isObject(item)) {
            return 'JSON ที่วางต้องเป็นข้อมูลก้อนเดียวที่ขึ้นต้นด้วย { ไม่ใช่รายการหรือข้อความธรรมดา';
        }

        const requiredStrings = [
            'title',
            'type',
            'date',
            'role',
            'description'
        ];

        for (const field of requiredStrings) {
            if (
                typeof item[field] !== 'string' ||
                item[field].trim() === ''
            ) {
                return 'ช่อง ' + field + ' ใน JSON ว่างอยู่ หรือไม่ใช่ข้อความ';
            }
        }

        const allowedTypes = [
            'Project',
            'Activity',
            'Certificate',
            'Challenge'
        ];

        if (!allowedTypes.includes(item.type)) {
            return 'type ต้องเป็น Project, Activity, Certificate หรือ Challenge อย่างใดอย่างหนึ่ง';
        }

        if (!isRealDate(item.date)) {
            return 'วันที่ต้องเขียนแบบ ปปปป-ดด-วว เช่น 2026-11-24 และต้องเป็นวันที่ที่มีจริง';
        }

        if (
            !Array.isArray(item.skills) ||
            item.skills.length < 1 ||
            item.skills.length > 20 ||
            !item.skills.every(
                skill =>
                    typeof skill === 'string' &&
                    skill.trim() !== ''
            )
        ) {
            return 'skills ต้องมีทักษะอย่างน้อย 1 อย่าง และไม่เกิน 20 อย่าง';
        }

        if (!isObject(item.reflection)) {
            return 'reflection ต้องมี 4 ช่อง คือ whatIDid, whatILearned, challenge, nextStep';
        }

        const reflectionFields = [
            'whatIDid',
            'whatILearned',
            'challenge',
            'nextStep'
        ];

        for (const field of reflectionFields) {
            if (typeof item.reflection[field] !== 'string') {
                return 'reflection.' + field + ' ต้องเป็นข้อความ';
            }
        }

        if (
            !Array.isArray(item.evidence) ||
            item.evidence.length < 1 ||
            item.evidence.length > 10 ||
            !item.evidence.every(
                url =>
                    typeof url === 'string' &&
                    isHttpUrl(url)
            )
        ) {
            return 'evidence ต้องมีลิงก์ที่ขึ้นต้นด้วย http:// หรือ https:// อย่างน้อย 1 ลิงก์';
        }

        // ตรวจสอบ optional fields ถ้ามีต้องเป็นชนิดที่ถูกต้อง
        if (
            item.challengeId !== undefined &&
            typeof item.challengeId !== 'string'
        ) {
            return 'challengeId ต้องเป็นข้อความ';
        }

        if (
            item.hostGroup !== undefined &&
            typeof item.hostGroup !== 'string'
        ) {
            return 'hostGroup ต้องเป็นข้อความ';
        }

        if (
            item.category !== undefined &&
            !['discover', 'mix', 'levelup'].includes(item.category)
        ) {
            return 'category ต้องเป็น discover, mix หรือ levelup';
        }

        if (
            item.schemaVersion !== undefined &&
            item.schemaVersion !== '1.0'
        ) {
            return 'schemaVersion ต้องเป็น 1.0';
        }

        return null;
    }

    // ===== IMPORT =====
    if (importButton) {
        importButton.addEventListener('click', function () {

            showMessage(importMessage, '');

            const rawJson = importInput.value.trim();

            if (!rawJson) {
                showMessage(
                    importMessage,
                    'ยังไม่ได้วาง JSON วางในช่องด้านบนก่อนแล้วกด Import อีกครั้ง',
                    true
                );
                return;
            }

            // ต้องเลือก Profile ปลายทางก่อน
            if (!importProfileSelect || !importProfileSelect.value) {
                showMessage(
                    importMessage,
                    'เลือกโปรไฟล์ที่จะเก็บผลงานนี้ก่อนกด Import',
                    true
                );
                return;
            }

            let importedItem;

            try {
                importedItem = JSON.parse(rawJson);
            } catch (error) {
                showMessage(
                    importMessage,
                    'อ่าน JSON ไม่ได้ ลองเช็คว่าวางมาครบ ไม่ขาดวงเล็บหรือเครื่องหมายคำพูด',
                    true
                );
                return;
            }

            const validationError = validateImportedItem(importedItem);

            if (validationError) {
                showMessage(importMessage, validationError, true);
                return;
            }

            // ไม่ใช้ id หรือ profileId จาก JSON ต้นทาง
            const item = { ...importedItem };
            delete item.id;
            delete item.profileId;

            // เก็บข้อมูลทั้งหมดไว้ เพื่อส่งฟิลด์เสริมตอน Save
            window.pendingImportedItem = item;

            // ตั้ง Profile ปลายทางในฟอร์ม Add Item ตามที่เลือก
            document.getElementById('profileSelect').value =
                importProfileSelect.value;

            // เติมข้อมูลทั่วไปลงใน Add Item Form
            document.getElementById('title').value = item.title;
            document.getElementById('type').value = item.type;
            document.getElementById('date').value = item.date;
            document.getElementById('role').value = item.role;
            document.getElementById('description').value = item.description;

            document.getElementById('skills').value =
                item.skills.join(', ');

            // เติม Reflection ที่ได้รับมาให้ผู้ใช้ตรวจสอบและแก้ไขได้
            const reflection = item.reflection;

            document.getElementById('whatIDid').value =
                reflection.whatIDid === '(เขียนเอง)' ? '' : reflection.whatIDid;

            document.getElementById('whatILearned').value =
                reflection.whatILearned === '(เขียนเอง)' ? '' : reflection.whatILearned;

            document.getElementById('challenge').value =
                reflection.challenge === '(เขียนเอง)' ? '' : reflection.challenge;

            document.getElementById('nextStep').value =
                reflection.nextStep === '(เขียนเอง)' ? '' : reflection.nextStep;

            // ช่อง Evidence ในฟอร์มรับ URL เดียว
            document.getElementById('evidence').value =
                item.evidence[0];

            showMessage(
                importMessage,
                'Import เรียบร้อย ข้อมูลถูกเติมในฟอร์มเพิ่มผลงานแล้ว เขียน Reflection ของคุณให้ครบ เช็คลิงก์หลักฐาน แล้วกดบันทึกผลงาน'
            );

            // เลื่อนไปยังแบบฟอร์มเพิ่มผลงาน
            document.getElementById('add-portfolio-item')
                .scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ===== LOAD PROFILES (Import + Export dropdown) =====
    async function loadProfileOptions() {
        try {
            const profiles = await getProfiles();

            [importProfileSelect, exportProfileSelect].forEach(select => {
                if (!select) return;

                const current = select.value;
                select.innerHTML =
                    '<option value="">-- เลือก Profile --</option>';

                profiles.forEach(profile => {
                    const option = document.createElement('option');

                    option.value = profile.id;
                    option.textContent = profile.displayName;

                    select.appendChild(option);
                });

                select.value = current;
            });

        } catch (error) {
            showMessage(
                exportMessage,
                error.message || 'โหลดรายชื่อโปรไฟล์ไม่สำเร็จ',
                true
            );
        }
    }

    loadProfileOptions();

    // ===== EXPORT =====
    if (exportButton) {
        exportButton.addEventListener('click', async function () {

            showMessage(exportMessage, '');

            const profileId = exportProfileSelect.value;

            if (!profileId) {
                showMessage(
                    exportMessage,
                    'เลือกโปรไฟล์ก่อน Export',
                    true
                );
                return;
            }

            try {
                const profiles = await getProfiles();

                const profile = profiles.find(
                    p => String(p.id) === String(profileId)
                );

                if (!profile) {
                    throw new Error('ไม่พบโปรไฟล์ที่เลือก');
                }

                const items = await getItems(profileId);

                // ตรวจสอบข้อมูลก่อน Export
                for (const item of items) {
                    const reflection = item.reflection;

                    if (
                        !isObject(reflection) ||
                        !['whatIDid', 'whatILearned', 'challenge', 'nextStep']
                            .every(
                                field =>
                                    typeof reflection[field] === 'string' &&
                                    reflection[field].trim() !== '' &&
                                    reflection[field] !== '(เขียนเอง)'
                            )
                    ) {
                        throw new Error(
                            'มีผลงานที่ Reflection ยังเขียนไม่ครบ ต้องแก้ผลงานนั้นก่อนถึงจะ Export ได้'
                        );
                    }

                    if (
                        !Array.isArray(item.evidence) ||
                        item.evidence.length < 1 ||
                        !item.evidence.every(
                            url =>
                                typeof url === 'string' &&
                                isHttpUrl(url)
                        )
                    ) {
                        throw new Error(
                            'มีผลงานที่ลิงก์หลักฐานไม่ถูกต้อง ต้องแก้ก่อนถึงจะ Export ได้'
                        );
                    }
                }

                // โครงสร้าง: Profile อยู่ระดับบน และ items อยู่ภายใน
                const portfolio = {
                    ...profile,
                    items: items
                };

                const json = JSON.stringify(portfolio, null, 2);

                const blob = new Blob(
                    [json],
                    { type: 'application/json' }
                );

                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'my-portfolio.json';

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000);

                showMessage(
                    exportMessage,
                    'Export สำเร็จ ได้ไฟล์ my-portfolio.json แล้ว'
                );

            } catch (error) {
                showMessage(
                    exportMessage,
                    error.message || 'Export ไม่สำเร็จ',
                    true
                );
            }
        });
    }
});