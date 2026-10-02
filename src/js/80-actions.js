// High-level commands and delegated button actions.
function duplicateSection(original) {
    const originalName = original.querySelector('.tm-section-name-input').value.trim() || 'Часть';
    const copy = addSection({
        focus: false,
        name: `${originalName} (копия)`,
        instructions: original.querySelector('.tm-instructions').value,
        editorHtml: original.querySelector('.tm-editor').innerHTML
    });
    original.after(copy);
    copy.querySelector('.tm-instructions-wrap').classList.remove('tm-open');
    updateSectionNumbers();
    scheduleDraftSave();
    copy.querySelector('.tm-editor').focus();
}

async function clearFilledContent() {
    const editors = [...sectionsContainer.querySelectorAll('.tm-editor')];
    const hasContent = editors.some(editor =>
        Boolean(editor.textContent?.trim()) || Boolean(editor.querySelector('img[data-image-id], a[data-file-id]'))
    );

    if (!hasContent) {
        setStatus('Основные поля уже пусты. Инструкции не изменены.');
        return;
    }

    const confirmed = window.confirm(
        'Очистить текст, изображения и файлы во всех частях?\n\nИнструкции и сами части останутся.'
    );
    if (!confirmed) return;

    for (const editor of editors) editor.innerHTML = '';
    saveDraftNow();
    await garbageCollectImages();
    setStatus('Текст, изображения и файлы очищены. Инструкции сохранены.');
}

panel.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;

    if (action === 'library') {
        libraryPanel.classList.toggle('tm-open');
        if (libraryPanel.classList.contains('tm-open')) {
            settingsPanel.classList.remove('tm-open');
            refreshLibraryUi();
            requestAnimationFrame(() => currentSetNameInput.focus());
        }
        return;
    }
    if (action === 'settings') {
        settingsPanel.classList.toggle('tm-open');
        if (settingsPanel.classList.contains('tm-open')) libraryPanel.classList.remove('tm-open');
        if (settingsPanel.classList.contains('tm-open')) {
            const values = getStoredZIndexes();
            launcherZIndexInput.value = String(values.launcher);
            panelZIndexInput.value = String(values.panel);
            requestAnimationFrame(() => launcherZIndexInput.focus());
        }
        return;
    }
    if (action === 'add') {
        addSection();
        scheduleDraftSave();
        return;
    }
    if (action === 'clear-content') {
        clearFilledContent();
        return;
    }
    if (action === 'export') {
        // Экспорт только создаёт ZIP и ничего не очищает.
        exportZip();
        return;
    }
    if (action === 'new-set') { newSet(); return; }
    if (action === 'save-set') { saveCurrentSetTemplate(); return; }
    if (action === 'load-set') { loadSelectedSet(); return; }
    if (action === 'rename-set') { renameSelectedSet(); return; }
    if (action === 'delete-set') { deleteSelectedSet(); return; }
    if (action === 'add-template-part') { addSelectedTemplatePart(); return; }
    if (action === 'rename-template') { renameSelectedTemplate(); return; }
    if (action === 'delete-template') { deleteSelectedTemplate(); return; }

    const section = button.closest('.tm-section');
    if (!section) return;

    if (action === 'save-part-template') {
        saveSectionAsTemplate(section);
        return;
    }
    if (action === 'toggle-instructions') {
        const wrap = section.querySelector('.tm-instructions-wrap');
        const open = wrap.classList.toggle('tm-open');
        if (open) section.querySelector('.tm-instructions').focus();
        return;
    }
    if (action === 'insert-file') {
        section.querySelector('.tm-file-input')?.click();
        return;
    }
    if (action === 'delete') {
        const name = section.querySelector('.tm-section-name-input')?.value.trim() || 'эту часть';
        const confirmed = window.confirm(
            `Удалить «${name}»?\n\nБудут удалены текст, изображения, файлы и инструкции этой части.`
        );
        if (!confirmed) return;

        section.remove();
        updateSectionNumbers();
        scheduleDraftSave();
        return;
    }
    if (action === 'up') {
        const previous = section.previousElementSibling;
        if (previous?.classList.contains('tm-section')) {
            previous.before(section);
            updateSectionNumbers();
            scheduleDraftSave();
        }
        return;
    }
    if (action === 'down') {
        const next = section.nextElementSibling;
        if (next?.classList.contains('tm-section')) {
            next.after(section);
            updateSectionNumbers();
            scheduleDraftSave();
        }
        return;
    }
    if (action === 'duplicate') duplicateSection(section);
});
