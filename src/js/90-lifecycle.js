// Restore startup state and persist final state on resize/unload.
async function restoreDraft() {
    const draft = readStoredJson(STORAGE_KEYS.draft);
    const sections = Array.isArray(draft?.sections) ? draft.sections : [];
    currentSetNameInput.value = typeof draft?.setName === 'string' ? draft.setName : '';
    updateCurrentSetTitle();

    if (sections.length) {
        for (let i = 0; i < sections.length; i++) {
            const saved = sections[i];
            addSection({
                focus: false,
                name: typeof saved.name === 'string' && saved.name.trim() ? saved.name : `Часть ${i + 1}`,
                instructions: typeof saved.instructions === 'string' ? saved.instructions : '',
                editorHtml: typeof saved.editorHtml === 'string' ? saved.editorHtml : ''
            });
        }
        await restorePersistedImages();
    } else {
        addSection({ focus: false });
        saveDraftNow();
    }
    refreshLibraryUi();
}

window.addEventListener('resize', () => {
    applyLauncherPosition(readStoredJson(STORAGE_KEYS.launcherPosition) || getLauncherPosition());
    applySavedPanelSize();
    if (panel.classList.contains('tm-open')) {
        const rect = panel.getBoundingClientRect();
        const pos = clampPanelPosition(rect.left, rect.top);
        panel.style.left = `${Math.round(pos.left)}px`;
        panel.style.top = `${Math.round(pos.top)}px`;
    }
});

window.addEventListener('beforeunload', () => {
    clearTimeout(draftSaveTimer);
    saveDraftNow();
    savePanelSize();
    resizeObserver.disconnect();
    for (const image of images.values()) URL.revokeObjectURL(image.objectUrl);
});

restoreDraft().catch(error => {
    console.error('[Response Composer] restore failed:', error);
    if (!sectionsContainer.querySelector('.tm-section')) addSection({ focus: false });
});
