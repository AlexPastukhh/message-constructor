// Section creation, naming, editor wiring and section drag/drop.
function addSection({ focus = true, name = '', instructions = '', editorHtml = '' } = {}) {
    removeEmptyMessage();
    sectionCounter++;

    const section = document.createElement('div');
    section.className = 'tm-section';
    section.dataset.sectionId = String(sectionCounter);
    section.innerHTML = SECTION_HTML;

    const nameEl = section.querySelector('.tm-section-name-input');
    const instructionsEl = section.querySelector('.tm-instructions');
    const editor = section.querySelector('.tm-editor');
    nameEl.value = name || `Часть ${sectionCounter}`;
    instructionsEl.value = instructions;
    editor.innerHTML = editorHtml;
    updateInstructionButton(section);

    nameEl.addEventListener('input', scheduleDraftSave);
    instructionsEl.addEventListener('input', () => {
        updateInstructionButton(section);
        scheduleDraftSave();
    });
    editor.addEventListener('input', scheduleDraftSave);
    editor.addEventListener('paste', event => handlePaste(event, editor));
    editor.addEventListener('click', event => {
        if (event.target.closest('a[data-file-id]')) event.preventDefault();
    });
    editor.addEventListener('dragover', event => {
        if (event.dataTransfer?.files?.length) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        }
    });
    editor.addEventListener('drop', async event => {
        const droppedFiles = [...(event.dataTransfer?.files || [])];
        if (!droppedFiles.length) return;
        event.preventDefault();
        event.stopPropagation();
        let inserted = 0;
        for (const file of droppedFiles) {
            await insertAttachment(editor, file);
            inserted++;
        }
        if (inserted) setStatus(`Добавлено файлов: ${inserted}`);
    });

    const fileInput = section.querySelector('.tm-file-input');
    fileInput.addEventListener('change', async () => {
        const selectedFiles = [...fileInput.files];
        fileInput.value = '';
        if (!selectedFiles.length) return;
        let inserted = 0;
        for (const file of selectedFiles) {
            await insertAttachment(editor, file);
            inserted++;
        }
        if (inserted) setStatus(`Добавлено файлов: ${inserted}`);
    });

    const dragHandle = section.querySelector('.tm-section-drag-handle');
    dragHandle.addEventListener('dragstart', event => {
        draggedSection = section;
        section.classList.add('tm-section-dragging');
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', section.dataset.sectionId || 'section');
        }
    });
    dragHandle.addEventListener('dragend', () => {
        section.classList.remove('tm-section-dragging');
        draggedSection = null;
        updateSectionNumbers();
        scheduleDraftSave();
    });

    sectionsContainer.appendChild(section);
    updateSectionNumbers();
    if (focus) editor.focus();
    return section;
}

sectionsContainer.addEventListener('dragover', event => {
    if (!draggedSection) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';

    const target = event.target.closest('.tm-section');
    if (!target || target === draggedSection) return;

    const rect = target.getBoundingClientRect();
    const insertBefore = event.clientY < rect.top + rect.height / 2;
    if (insertBefore) {
        if (target.previousElementSibling !== draggedSection) target.before(draggedSection);
    } else {
        if (target.nextElementSibling !== draggedSection) target.after(draggedSection);
    }
    updateSectionNumbers();

    const box = sectionsContainer.getBoundingClientRect();
    const edge = 42;
    if (event.clientY < box.top + edge) sectionsContainer.scrollTop -= 18;
    else if (event.clientY > box.bottom - edge) sectionsContainer.scrollTop += 18;
});

sectionsContainer.addEventListener('drop', event => {
    if (!draggedSection) return;
    event.preventDefault();
    updateSectionNumbers();
    scheduleDraftSave();
});
