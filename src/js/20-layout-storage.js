// LocalStorage helpers, z-index, panel sizing and drag behavior.
function readStoredJson(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeStoredJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('[Response Composer] localStorage unavailable:', error);
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function normalizeZIndex(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_Z_INDEX;
    return Math.round(clamp(parsed, MIN_Z_INDEX, MAX_Z_INDEX));
}

function getStoredZIndexes() {
    const settings = readStoredJson(STORAGE_KEYS.uiSettings) || {};
    // Миграция с v0.6.0: старое единое поле zIndex используется как
    // начальное значение для обоих независимых z-index.
    const legacyZIndex = settings.zIndex;
    return {
        launcher: normalizeZIndex(settings.launcherZIndex ?? legacyZIndex),
        panel: normalizeZIndex(settings.panelZIndex ?? legacyZIndex)
    };
}

function applyLauncherZIndex(value, { save = false } = {}) {
    const zIndex = normalizeZIndex(value);
    launcher.style.zIndex = String(zIndex);
    launcherZIndexInput.value = String(zIndex);

    if (save) {
        const current = readStoredJson(STORAGE_KEYS.uiSettings) || {};
        writeStoredJson(STORAGE_KEYS.uiSettings, { ...current, launcherZIndex: zIndex });
    }
    return zIndex;
}

function applyPanelZIndex(value, { save = false } = {}) {
    const zIndex = normalizeZIndex(value);
    panel.style.zIndex = String(zIndex);
    panelZIndexInput.value = String(zIndex);

    if (save) {
        const current = readStoredJson(STORAGE_KEYS.uiSettings) || {};
        writeStoredJson(STORAGE_KEYS.uiSettings, { ...current, panelZIndex: zIndex });
    }
    return zIndex;
}

function getLauncherPosition() {
    const rect = launcher.getBoundingClientRect();
    return {
        left: Number.isFinite(parseFloat(launcher.style.left)) ? parseFloat(launcher.style.left) : rect.left,
        top: Number.isFinite(parseFloat(launcher.style.top)) ? parseFloat(launcher.style.top) : rect.top
    };
}

function applyLauncherPosition(position = null) {
    const width = 50;
    const height = 50;
    const maxLeft = Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN);
    const maxTop = Math.max(EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN);
    const requestedLeft = Number(position?.left);
    const requestedTop = Number(position?.top);
    const left = Number.isFinite(requestedLeft) ? requestedLeft : 18;
    const top = Number.isFinite(requestedTop) ? requestedTop : 90;

    launcher.style.left = `${Math.round(clamp(left, EDGE_MARGIN, maxLeft))}px`;
    launcher.style.top = `${Math.round(clamp(top, EDGE_MARGIN, maxTop))}px`;
}

function saveLauncherPosition(position = null) {
    const pos = position || getLauncherPosition();
    writeStoredJson(STORAGE_KEYS.launcherPosition, {
        left: Math.round(pos.left),
        top: Math.round(pos.top)
    });
}

function applySavedPanelSize() {
    const saved = readStoredJson(STORAGE_KEYS.panelSize) || DEFAULT_PANEL_SIZE;
    const maxWidth = Math.max(MIN_PANEL_SIZE.width, window.innerWidth - EDGE_MARGIN * 2);
    const maxHeight = Math.max(MIN_PANEL_SIZE.height, window.innerHeight - EDGE_MARGIN * 2);
    const width = clamp(Number(saved.width) || DEFAULT_PANEL_SIZE.width, MIN_PANEL_SIZE.width, maxWidth);
    const height = clamp(Number(saved.height) || DEFAULT_PANEL_SIZE.height, MIN_PANEL_SIZE.height, maxHeight);
    panel.style.width = `${Math.round(width)}px`;
    panel.style.height = `${Math.round(height)}px`;
}

function savePanelSize() {
    const rect = panel.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    writeStoredJson(STORAGE_KEYS.panelSize, {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
    });
}

function clampPanelPosition(left, top) {
    const rect = panel.getBoundingClientRect();
    return {
        left: clamp(left, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerWidth - rect.width - EDGE_MARGIN)),
        top: clamp(top, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerHeight - rect.height - EDGE_MARGIN))
    };
}

function placePanelAtLauncher() {
    const savedAnchor = readStoredJson(STORAGE_KEYS.launcherPosition) || getLauncherPosition();
    const pos = clampPanelPosition(Number(savedAnchor.left) || 18, Number(savedAnchor.top) || 90);
    panel.style.left = `${Math.round(pos.left)}px`;
    panel.style.top = `${Math.round(pos.top)}px`;
}

function setPanelOpen(open) {
    if (open) {
        panelMovedSinceOpen = false;
        applySavedPanelSize();
        panel.classList.add('tm-open');
        placePanelAtLauncher();
        launcher.style.display = 'none';
        return;
    }

    // Важно: координаты нужно снять ДО display:none, иначе hidden-панель
    // вернёт прямоугольник 0x0 и кнопка уедет к левому верхнему краю.
    const panelRectBeforeHide = panelMovedSinceOpen
        ? panel.getBoundingClientRect()
        : null;

    panel.classList.remove('tm-open');
    launcher.style.display = 'flex';

    if (panelRectBeforeHide) {
        applyLauncherPosition({
            left: panelRectBeforeHide.left,
            top: panelRectBeforeHide.top
        });
        saveLauncherPosition();
    } else {
        applyLauncherPosition(readStoredJson(STORAGE_KEYS.launcherPosition));
    }
}

const storedZIndexes = getStoredZIndexes();
applyLauncherZIndex(storedZIndexes.launcher);
applyPanelZIndex(storedZIndexes.panel);
applyLauncherPosition(readStoredJson(STORAGE_KEYS.launcherPosition));
applySavedPanelSize();

currentSetNameInput.addEventListener('input', () => {
    updateCurrentSetTitle();
    scheduleDraftSave();
});

launcherZIndexInput.addEventListener('change', () => {
    const zIndex = applyLauncherZIndex(launcherZIndexInput.value, { save: true });
    setStatus(`z-index кнопки сохранён: ${zIndex}`);
});

panelZIndexInput.addEventListener('change', () => {
    const zIndex = applyPanelZIndex(panelZIndexInput.value, { save: true });
    setStatus(`z-index виджета сохранён: ${zIndex}`);
});

for (const input of [launcherZIndexInput, panelZIndexInput]) {
    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        input.blur();
    });
}

let resizeSaveTimer = null;
const resizeObserver = new ResizeObserver(() => {
    if (!panel.classList.contains('tm-open')) return;
    clearTimeout(resizeSaveTimer);
    resizeSaveTimer = setTimeout(savePanelSize, 150);
});
resizeObserver.observe(panel);

let launcherDrag = null;
let suppressLauncherClick = false;

launcher.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    launcherDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        moved: false
    };
    launcher.setPointerCapture(event.pointerId);
});

launcher.addEventListener('pointermove', event => {
    if (!launcherDrag || event.pointerId !== launcherDrag.pointerId) return;
    const dx = event.clientX - launcherDrag.startX;
    const dy = event.clientY - launcherDrag.startY;
    if (!launcherDrag.moved && Math.hypot(dx, dy) < 4) return;

    launcherDrag.moved = true;
    launcher.classList.add('tm-dragging');
    applyLauncherPosition({
        left: launcherDrag.startLeft + dx,
        top: launcherDrag.startTop + dy
    });
});

function finishLauncherDrag(event) {
    if (!launcherDrag || event.pointerId !== launcherDrag.pointerId) return;
    const moved = launcherDrag.moved;
    launcherDrag = null;
    launcher.classList.remove('tm-dragging');
    try { launcher.releasePointerCapture(event.pointerId); } catch {}

    if (moved) {
        saveLauncherPosition();
        suppressLauncherClick = true;
        setTimeout(() => { suppressLauncherClick = false; }, 0);
    }
}

launcher.addEventListener('pointerup', finishLauncherDrag);
launcher.addEventListener('pointercancel', finishLauncherDrag);
launcher.addEventListener('click', () => {
    if (!suppressLauncherClick) setPanelOpen(true);
});

let panelDrag = null;

header.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button, input, select, textarea')) return;
    const rect = panel.getBoundingClientRect();
    panelDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        moved: false
    };
    header.setPointerCapture(event.pointerId);
    event.preventDefault();
});

header.addEventListener('pointermove', event => {
    if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
    const dx = event.clientX - panelDrag.startX;
    const dy = event.clientY - panelDrag.startY;
    if (!panelDrag.moved && Math.hypot(dx, dy) < 3) return;

    panelDrag.moved = true;
    header.classList.add('tm-dragging');
    const pos = clampPanelPosition(panelDrag.startLeft + dx, panelDrag.startTop + dy);
    panel.style.left = `${Math.round(pos.left)}px`;
    panel.style.top = `${Math.round(pos.top)}px`;
    panelMovedSinceOpen = true;
});

function finishPanelDrag(event, cancelled = false) {
    if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
    const moved = panelDrag.moved;
    panelDrag = null;
    header.classList.remove('tm-dragging');
    try { header.releasePointerCapture(event.pointerId); } catch {}

    if (moved) {
        const rect = panel.getBoundingClientRect();
        const anchor = { left: rect.left, top: rect.top };
        saveLauncherPosition(anchor);
        return;
    }

    if (cancelled) return;

    // Короткий клик по свободной области хедера сворачивает виджет.
    saveDraftNow();
    savePanelSize();
    setPanelOpen(false);
}

header.addEventListener('pointerup', event => finishPanelDrag(event, false));
header.addEventListener('pointercancel', event => finishPanelDrag(event, true));
