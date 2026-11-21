// ===== IMPORT / EXPORT =====

// เก็บข้อมูล JSON ที่ Import ไว้ชั่วคราว
// เพื่อให้ app.js นำฟิลด์เสริมไปบันทึกพร้อม Portfolio Item
window.pendingImportedItem = null;

document.addEventListener('DOMContentLoaded', function () {

    // ===== ELEMENTS =====
    const importButton = document.getElementById('import-challenge-button');
    const importInput = document.getElementById('importJson');
    const importMessage = document.getElementById('import-message');

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
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const date = new Date(value + 'T00:00:00');

        return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
    }

    function validateImportedItem(item) {
        if (!isObject(item)) {
            return 'ข้อมูล JSON ต้องเป็น Object';
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
                return 'กรุณาตรวจสอบฟิลด์ ' + field;
            }
        }

        const allowedTypes = [
            'Project',
            'Activity',
            'Certificate',
            'Challenge'
        ];

        if (!allowedTypes.includes(item.type)) {
            return 'ประเภทผลงานไม่ถูกต้อง';
        }

        if (!isRealDate(item.date)) {
            return 'รูปแบบวันที่ไม่ถูกต้อง';
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
            return 'Skills ต้องเป็น Array ของข้อความ 1–20 รายการ';
        }

        if (!isObject(item.reflection)) {
            return 'Reflection ต้องเป็น Object';
        }

        const reflectionFields = [
            'whatIDid',
            'whatILearned',
            'challenge',
            'nextStep'
        ];

        for (const field of reflectionFields) {
            if (typeof item.reflection[field] !== 'string') {
                return 'Reflection ช่อง ' + field + ' ต้องเป็นข้อความ';
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
            return 'Evidence ต้องเป็น Array ที่มีลิงก์ HTTP/HTTPS อย่างน้อย 1 ลิงก์';
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
                    'กรุณาวาง JSON ก่อนกด Import',
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
                    'JSON ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง',
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
                'Import สำเร็จ! เลือก Profile ของตัวเองในส่วน Add Item เติม Reflection ให้ครบ ตรวจสอบ Evidence แล้วกดบันทึกผลงาน'
            );

            // เลื่อนไปยังแบบฟอร์มเพิ่มผลงาน
            document.getElementById('add-portfolio-item')
                .scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ===== LOAD EXPORT PROFILES =====
    async function loadExportProfiles() {
        if (!exportProfileSelect) return;

        try {
            const profiles = await getProfiles();

            exportProfileSelect.innerHTML =
                '<option value="">-- เลือก Profile --</option>';

            profiles.forEach(profile => {
                const option = document.createElement('option');

                option.value = profile.id;
                option.textContent = profile.displayName;

                exportProfileSelect.appendChild(option);
            });

        } catch (error) {
            showMessage(
                exportMessage,
                error.message || 'ไม่สามารถโหลด Profiles ได้',
                true
            );
        }
    }

    loadExportProfiles();

    // ===== EXPORT =====
    if (exportButton) {
        exportButton.addEventListener('click', async function () {

            showMessage(exportMessage, '');

            const profileId = exportProfileSelect.value;

            if (!profileId) {
                showMessage(
                    exportMessage,
                    'กรุณาเลือก Profile ก่อน Export',
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
                    throw new Error('ไม่พบ Profile ที่เลือก');
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
                            'มีผลงานที่ Reflection ยังไม่ครบ กรุณาแก้ไขก่อน Export'
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
                            'มีผลงานที่ Evidence ไม่ถูกต้อง กรุณาแก้ไขก่อน Export'
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
                    'Export my-portfolio.json สำเร็จ!'
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