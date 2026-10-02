// Reusable part/set library plus draft serialization/autosave helpers.
function setStatus(text, timeout = 4000) {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        status.textContent = 'Черновик сохраняется локально. Ctrl+V вставляет изображение; файлы можно добавить кнопкой.';
    }, timeout);
}

function removeEmptyMessage() {
    sectionsContainer.querySelector('.tm-empty')?.remove();
}

function getSectionName(section, index = 0) {
    const value = section.querySelector('.tm-section-name-input')?.value.trim();
    return value || `Часть ${index + 1}`;
}

function updateCurrentSetTitle() {
    const name = currentSetNameInput.value.trim();
    currentSetTitle.textContent = name ? ` — ${name}` : '';
}

function getPartTemplates() {
    const value = readStoredJson(STORAGE_KEYS.partTemplates);
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string') : [];
}

function setPartTemplates(items) {
    writeStoredJson(STORAGE_KEYS.partTemplates, items);
    refreshLibraryUi();
}

function getSavedSets() {
    const value = readStoredJson(STORAGE_KEYS.savedSets);
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string') : [];
}

function setSavedSets(items) {
    writeStoredJson(STORAGE_KEYS.savedSets, items);
    refreshLibraryUi();
}

function makeLibraryId(prefix) {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sortedLibrary(items) {
    return [...items].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ru'));
}

function fillLibrarySelect(select, items, placeholder) {
    const previous = select.value;
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    select.appendChild(empty);
    for (const item of sortedLibrary(items)) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name || 'Без названия';
        select.appendChild(option);
    }
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
}

function refreshLibraryUi() {
    fillLibrarySelect(partTemplatesSelect, getPartTemplates(), '— выбрать сохранённую часть —');
    fillLibrarySelect(savedSetsSelect, getSavedSets(), '— выбрать сохранённый набор —');
    updateCurrentSetTitle();
}

function upsertNamedLibraryItem(items, item, label) {
    const sameNameIndex = items.findIndex(existing =>
        String(existing.name || '').trim().toLocaleLowerCase('ru') === item.name.trim().toLocaleLowerCase('ru')
    );
    if (sameNameIndex >= 0) {
        const confirmed = window.confirm(`${label} «${item.name}» уже существует. Перезаписать?`);
        if (!confirmed) return null;
        item.id = items[sameNameIndex].id;
        items.splice(sameNameIndex, 1, item);
        return item;
    }
    items.push(item);
    return item;
}

function saveSectionAsTemplate(section) {
    const sectionIndex = [...sectionsContainer.querySelectorAll('.tm-section')].indexOf(section);
    const defaultName = getSectionName(section, Math.max(sectionIndex, 0));
    const name = window.prompt('Название шаблона части:', defaultName)?.trim();
    if (!name) return;
    const items = getPartTemplates();
    const saved = upsertNamedLibraryItem(items, {
        id: makeLibraryId('part'),
        name,
        instructions: section.querySelector('.tm-instructions').value,
        updatedAt: Date.now()
    }, 'Шаблон части');
    if (!saved) return;
    setPartTemplates(items);
    partTemplatesSelect.value = saved.id;
    setStatus(`Часть «${name}» сохранена в библиотеку.`);
}

function addSelectedTemplatePart() {
    const template = getPartTemplates().find(item => item.id === partTemplatesSelect.value);
    if (!template) {
        setStatus('Сначала выберите сохранённую часть.');
        return;
    }
    const section = addSection({
        focus: false,
        name: template.name,
        instructions: typeof template.instructions === 'string' ? template.instructions : ''
    });
    scheduleDraftSave();
    section.querySelector('.tm-editor').focus();
    setStatus(`Добавлена часть «${template.name}».`);
}

function renameSelectedTemplate() {
    const items = getPartTemplates();
    const item = items.find(entry => entry.id === partTemplatesSelect.value);
    if (!item) { setStatus('Сначала выберите сохранённую часть.'); return; }
    const name = window.prompt('Новое название шаблона части:', item.name)?.trim();
    if (!name || name === item.name) return;
    if (items.some(entry => entry.id !== item.id && entry.name.trim().toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru'))) {
        setStatus('Шаблон части с таким названием уже существует.');
        return;
    }
    item.name = name;
    item.updatedAt = Date.now();
    setPartTemplates(items);
    partTemplatesSelect.value = item.id;
    setStatus(`Шаблон переименован в «${name}».`);
}

function deleteSelectedTemplate() {
    const items = getPartTemplates();
    const item = items.find(entry => entry.id === partTemplatesSelect.value);
    if (!item) { setStatus('Сначала выберите сохранённую часть.'); return; }
    if (!window.confirm(`Удалить шаблон части «${item.name}»?\n\nТекущие части в черновике не изменятся.`)) return;
    setPartTemplates(items.filter(entry => entry.id !== item.id));
    setStatus(`Шаблон «${item.name}» удалён.`);
}

function currentPartsAsTemplates() {
    return [...sectionsContainer.querySelectorAll('.tm-section')].map((section, index) => ({
        name: getSectionName(section, index),
        instructions: section.querySelector('.tm-instructions').value
    }));
}

function saveCurrentSetTemplate() {
    const previousName = currentSetNameInput.value.trim();
    let name = previousName;
    if (!name) name = window.prompt('Название набора:', '')?.trim() || '';
    if (!name) return;

    const items = getSavedSets();
    const saved = upsertNamedLibraryItem(items, {
        id: makeLibraryId('set'),
        name,
        parts: currentPartsAsTemplates(),
        updatedAt: Date.now()
    }, 'Набор');

    // Если пользователь отменил перезапись одноимённого набора,
    // текущий черновик вообще не меняем.
    if (!saved) return;

    currentSetNameInput.value = name;
    updateCurrentSetTitle();
    setSavedSets(items);
    savedSetsSelect.value = saved.id;
    saveDraftNow();
    setStatus(`Набор «${name}» сохранён.`);
}

function draftHasUserContent() {
    const sections = [...sectionsContainer.querySelectorAll('.tm-section')];
    if (currentSetNameInput.value.trim() || sections.length > 1) return true;
    return sections.some((section, index) => {
        const editor = section.querySelector('.tm-editor');
        const name = getSectionName(section, index);
        const defaultName = `Часть ${index + 1}`;
        return name !== defaultName || Boolean(editor.textContent?.trim()) ||
            Boolean(editor.querySelector('img[data-image-id], a[data-file-id]')) ||
            Boolean(section.querySelector('.tm-instructions').value.trim());
    });
}

function confirmReplaceCurrentSet(actionText) {
    if (!draftHasUserContent()) return true;
    return window.confirm(`${actionText}?\n\nТекущий черновик будет заменён. Сохранённые шаблоны и наборы останутся.`);
}

async function replaceCurrentWithTemplateParts(name, parts) {
    sectionsContainer.innerHTML = '';
    currentSetNameInput.value = name || '';
    updateCurrentSetTitle();
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i] || {};
        addSection({
            focus: false,
            name: typeof part.name === 'string' && part.name.trim() ? part.name : `Часть ${i + 1}`,
            instructions: typeof part.instructions === 'string' ? part.instructions : ''
        });
    }
    if (!parts.length) addSection({ focus: false });
    saveDraftNow();
    await garbageCollectImages();
}

async function newSet() {
    if (!confirmReplaceCurrentSet('Создать новый набор')) return;
    await replaceCurrentWithTemplateParts('', [{ name: 'Часть 1', instructions: '' }]);
    setStatus('Создан новый пустой набор.');
}

async function loadSelectedSet() {
    const set = getSavedSets().find(item => item.id === savedSetsSelect.value);
    if (!set) { setStatus('Сначала выберите сохранённый набор.'); return; }
    if (!confirmReplaceCurrentSet(`Загрузить набор «${set.name}»`)) return;
    await replaceCurrentWithTemplateParts(set.name, Array.isArray(set.parts) ? set.parts : []);
    setStatus(`Набор «${set.name}» загружен.`);
}

function renameSelectedSet() {
    const items = getSavedSets();
    const item = items.find(entry => entry.id === savedSetsSelect.value);
    if (!item) { setStatus('Сначала выберите сохранённый набор.'); return; }
    const oldName = item.name;
    const name = window.prompt('Новое название набора:', oldName)?.trim();
    if (!name || name === oldName) return;
    if (items.some(entry => entry.id !== item.id && entry.name.trim().toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru'))) {
        setStatus('Набор с таким названием уже существует.');
        return;
    }
    item.name = name;
    item.updatedAt = Date.now();
    setSavedSets(items);
    savedSetsSelect.value = item.id;
    if (currentSetNameInput.value.trim() === oldName) {
        currentSetNameInput.value = name;
        updateCurrentSetTitle();
        saveDraftNow();
    }
    setStatus(`Набор переименован в «${name}».`);
}

function deleteSelectedSet() {
    const items = getSavedSets();
    const item = items.find(entry => entry.id === savedSetsSelect.value);
    if (!item) { setStatus('Сначала выберите сохранённый набор.'); return; }
    if (!window.confirm(`Удалить сохранённый набор «${item.name}»?\n\nТекущий черновик не изменится.`)) return;
    setSavedSets(items.filter(entry => entry.id !== item.id));
    setStatus(`Набор «${item.name}» удалён.`);
}

function escapeXmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeCommentText(value) {
    return String(value).replace(/--/g, '—');
}

function updateSectionNumbers() {
    const sections = [...sectionsContainer.querySelectorAll('.tm-section')];
    sections.forEach((section, index) => {
        const indexEl = section.querySelector('.tm-section-index');
        if (indexEl) indexEl.textContent = `#${index + 1}`;
    });

    if (!sections.length) {
        sectionsContainer.innerHTML = '<div class="tm-empty">Нет частей.<br>Нажмите «+ Часть» или выберите шаблон.</div>';
    }
}

function sanitizeEditorHtml(editor) {
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('img[data-image-id]').forEach(img => {
        img.removeAttribute('src');
        img.removeAttribute('srcset');
    });
    clone.querySelectorAll('a[data-file-id]').forEach(link => {
        link.removeAttribute('href');
        link.removeAttribute('onclick');
    });
    return clone.innerHTML;
}

function serializeDraft() {
    return {
        version: 4,
        setName: currentSetNameInput.value.trim(),
        sections: [...sectionsContainer.querySelectorAll('.tm-section')].map((section, index) => ({
            name: getSectionName(section, index),
            instructions: section.querySelector('.tm-instructions').value,
            editorHtml: sanitizeEditorHtml(section.querySelector('.tm-editor'))
        }))
    };
}

function saveDraftNow() {
    writeStoredJson(STORAGE_KEYS.draft, serializeDraft());
}

function scheduleDraftSave() {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(saveDraftNow, 250);
    clearTimeout(imageGcTimer);
    imageGcTimer = setTimeout(garbageCollectImages, 1200);
}

function updateInstructionButton(section) {
    const textarea = section.querySelector('.tm-instructions');
    const button = section.querySelector('[data-action="toggle-instructions"]');
    const hasValue = Boolean(textarea.value.trim());
    button.classList.toggle('tm-has-value', hasValue);
    button.textContent = hasValue ? 'Инструкции ✓' : 'Инструкции';
}
