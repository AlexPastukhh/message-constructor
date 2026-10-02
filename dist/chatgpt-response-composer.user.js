// ==UserScript==
// @name         ChatGPT Multi-Part Response Composer
// @namespace    local.chatgpt.response-composer
// @version      0.9.0
// @description  Конструктор многочастного ответа с локальным сохранением, библиотекой частей и наборов, drag&drop, изображениями, файлами и экспортом в ZIP
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Generated from src/styles.css and src/templates/*.html.
    const APP_CSS = "#tm-response-composer-launcher {\n    position: fixed;\n    left: 18px;\n    top: 90px;\n    width: 50px;\n    height: 50px;\n    z-index: 2147483000;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    border: 1px solid #4b4b4b;\n    border-radius: 14px;\n    background: #202020;\n    color: #f1f1f1;\n    box-shadow: 0 8px 24px rgba(0,0,0,.32);\n    cursor: grab;\n    user-select: none;\n    touch-action: none;\n    font: 700 13px/1 Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n}\n\n#tm-response-composer-launcher:hover {\n    background: #2b2b2b;\n    border-color: #666;\n}\n\n#tm-response-composer-launcher.tm-dragging { cursor: grabbing; }\n\n#tm-response-composer {\n    position: fixed;\n    left: 18px;\n    top: 90px;\n    width: 540px;\n    height: 720px;\n    min-width: 380px;\n    min-height: 340px;\n    max-width: calc(100vw - 16px);\n    max-height: calc(100vh - 16px);\n    z-index: 2147483000;\n    display: none;\n    flex-direction: column;\n    resize: both;\n    background: #161616;\n    color: #eee;\n    border: 1px solid #3a3a3a;\n    border-radius: 14px;\n    box-shadow: 0 20px 50px rgba(0,0,0,.45), 0 4px 10px rgba(0,0,0,.25);\n    font-family: Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n    overflow: hidden;\n}\n\n#tm-response-composer.tm-open { display: flex; }\n#tm-response-composer * { box-sizing: border-box; }\n\n.tm-header {\n    min-height: 58px;\n    flex-shrink: 0;\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 9px 10px 9px 14px;\n    background: #202020;\n    border-bottom: 1px solid #363636;\n    cursor: move;\n    user-select: none;\n    touch-action: none;\n}\n\n.tm-header.tm-dragging { cursor: grabbing; }\n\n.tm-title {\n    min-width: 0;\n    max-width: 230px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    font-size: 14px;\n    font-weight: 650;\n    white-space: nowrap;\n    margin-right: auto;\n    pointer-events: none;\n}\n\n.tm-btn,\n.tm-icon-btn,\n.tm-instructions-toggle {\n    border: 1px solid #484848;\n    background: #292929;\n    color: #eee;\n    border-radius: 8px;\n    cursor: pointer;\n    font-family: inherit;\n}\n\n.tm-btn {\n    padding: 7px 10px;\n    font-size: 12px;\n    font-weight: 550;\n}\n\n.tm-btn:hover,\n.tm-icon-btn:hover,\n.tm-instructions-toggle:hover { background: #353535; }\n\n.tm-btn-primary {\n    background: #0f7b55;\n    border-color: #139867;\n}\n\n.tm-btn-primary:hover { background: #119362; }\n\n.tm-settings-panel {\n    display: none;\n    flex-shrink: 0;\n    padding: 9px 12px;\n    background: #1b1b1b;\n    border-bottom: 1px solid #343434;\n}\n\n.tm-settings-panel.tm-open {\n    display: grid;\n    grid-template-columns: max-content minmax(110px, 170px);\n    align-items: center;\n    gap: 8px 10px;\n}\n\n.tm-settings-label {\n    color: #bdbdbd;\n    font-size: 12px;\n    font-weight: 600;\n    white-space: nowrap;\n}\n\n.tm-zindex-input {\n    width: 150px;\n    min-width: 0;\n    padding: 6px 8px;\n    border: 1px solid #484848;\n    border-radius: 7px;\n    background: #151515;\n    color: #eee;\n    outline: none;\n    font: 12px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;\n}\n\n.tm-zindex-input:focus { border-color: #707070; }\n\n.tm-settings-hint {\n    grid-column: 1 / -1;\n    min-width: 0;\n    color: #777;\n    font-size: 11px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n\n.tm-library-panel {\n    display: none;\n    flex-shrink: 0;\n    padding: 10px 12px;\n    background: #1b1b1b;\n    border-bottom: 1px solid #343434;\n    gap: 9px;\n}\n\n.tm-library-panel.tm-open { display: grid; }\n\n.tm-library-row {\n    display: flex;\n    align-items: center;\n    gap: 7px;\n    min-width: 0;\n    flex-wrap: wrap;\n}\n\n.tm-library-row > .tm-label {\n    width: 92px;\n    flex: 0 0 92px;\n}\n\n.tm-library-input,\n.tm-library-select {\n    min-width: 120px;\n    flex: 1 1 180px;\n    padding: 6px 8px;\n    border: 1px solid #484848;\n    border-radius: 7px;\n    background: #151515;\n    color: #eee;\n    outline: none;\n    font: 12px/1.3 inherit;\n}\n\n.tm-library-input:focus,\n.tm-library-select:focus { border-color: #707070; }\n\n.tm-library-hint {\n    color: #777;\n    font-size: 11px;\n    line-height: 1.35;\n}\n\n.tm-sections {\n    flex: 1;\n    min-height: 0;\n    overflow-y: auto;\n    padding: 12px;\n    display: flex;\n    flex-direction: column;\n    gap: 12px;\n}\n\n.tm-section {\n    flex-shrink: 0;\n    border: 1px solid #383838;\n    background: #202020;\n    border-radius: 12px;\n    overflow: hidden;\n    transition: opacity .12s ease, transform .12s ease;\n}\n\n.tm-section.tm-section-dragging {\n    opacity: .55;\n}\n\n.tm-section-header {\n    min-height: 43px;\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    padding: 7px 8px 7px 12px;\n    background: #262626;\n    border-bottom: 1px solid #373737;\n}\n\n.tm-section-index {\n    flex: 0 0 auto;\n    color: #858585;\n    font-size: 11px;\n    font-weight: 700;\n}\n\n.tm-section-name-input {\n    min-width: 70px;\n    flex: 1 1 150px;\n    margin-right: auto;\n    padding: 4px 7px;\n    border: 1px solid transparent;\n    border-radius: 6px;\n    background: transparent;\n    color: #eee;\n    outline: none;\n    font: 650 13px/1.25 inherit;\n}\n\n.tm-section-name-input:hover { background: #303030; }\n.tm-section-name-input:focus {\n    background: #181818;\n    border-color: #666;\n}\n\n.tm-section-drag-handle {\n    width: 24px;\n    height: 28px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n    color: #8d8d8d;\n    border-radius: 6px;\n    cursor: grab;\n    user-select: none;\n    font-size: 16px;\n    line-height: 1;\n}\n\n.tm-section-drag-handle:hover {\n    color: #eee;\n    background: #343434;\n}\n\n.tm-section-drag-handle:active { cursor: grabbing; }\n\n.tm-icon-btn {\n    height: 28px;\n    min-width: 30px;\n    padding: 0 7px;\n    color: #bbb;\n    font-size: 13px;\n}\n\n.tm-delete:hover {\n    background: #642c2c;\n    border-color: #944141;\n}\n\n.tm-section-content {\n    padding: 10px;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.tm-row {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n}\n\n.tm-label {\n    color: #9f9f9f;\n    font-size: 11px;\n    font-weight: 600;\n    text-transform: uppercase;\n    letter-spacing: .04em;\n}\n\n.tm-instructions-toggle {\n    padding: 6px 9px;\n    font-size: 11px;\n    color: #c7c7c7;\n}\n\n.tm-instructions-toggle.tm-has-value {\n    border-color: #47755f;\n    color: #cfe8da;\n}\n\n.tm-instructions-wrap {\n    display: none;\n}\n\n.tm-instructions-wrap.tm-open {\n    display: block;\n}\n\n.tm-instructions,\n.tm-editor {\n    width: 100%;\n    background: #181818;\n    color: #eee;\n    border: 1px solid #393939;\n    border-radius: 8px;\n    padding: 10px;\n    outline: none;\n    font-family: inherit;\n    font-size: 13px;\n    line-height: 1.5;\n}\n\n.tm-instructions {\n    display: block;\n    min-height: 84px;\n    max-height: 220px;\n    resize: vertical;\n}\n\n.tm-editor {\n    min-height: 145px;\n    max-height: 440px;\n    overflow-y: auto;\n    white-space: pre-wrap;\n    overflow-wrap: anywhere;\n}\n\n.tm-instructions:focus,\n.tm-editor:focus { border-color: #6b6b6b; }\n\n.tm-editor:empty::before {\n    content: \"Введите текст. Скриншот можно вставить Ctrl+V…\";\n    color: #666;\n    pointer-events: none;\n}\n\n.tm-editor img {\n    display: block;\n    max-width: 100%;\n    max-height: 280px;\n    object-fit: contain;\n    margin: 9px 0;\n    border: 1px solid #454545;\n    border-radius: 7px;\n}\n\n.tm-editor a[data-file-id] {\n    display: inline-block;\n    margin: 3px 2px;\n    padding: 4px 7px;\n    border: 1px solid #46505a;\n    border-radius: 6px;\n    background: #20262b;\n    color: #b9d7f5;\n    text-decoration: none;\n    cursor: default;\n}\n\n.tm-file-input { display: none !important; }\n\n.tm-footer {\n    flex-shrink: 0;\n    padding: 8px 12px;\n    background: #1d1d1d;\n    border-top: 1px solid #343434;\n    color: #888;\n    font-size: 11px;\n}\n\n.tm-empty {\n    padding: 30px 10px;\n    text-align: center;\n    color: #777;\n    font-size: 13px;\n}\n";
    const PANEL_HTML = "<div class=\"tm-header\" title=\"Перетащить — переместить виджет; клик по свободной области хедера — свернуть\">\n    <div class=\"tm-title\">Response Composer<span class=\"tm-current-set-title\"></span></div>\n    <button class=\"tm-btn\" data-action=\"library\" title=\"Шаблоны частей и наборы\">Библиотека</button>\n    <button class=\"tm-btn\" data-action=\"settings\" title=\"Настройки\">⚙</button>\n    <button class=\"tm-btn\" data-action=\"add\">+ Часть</button>\n    <button class=\"tm-btn\" data-action=\"clear-content\" title=\"Очистить текст, изображения и файлы, сохранив инструкции\">Очистить</button>\n    <button class=\"tm-btn tm-btn-primary\" data-action=\"export\">Скачать ZIP</button>\n</div>\n<div class=\"tm-settings-panel\">\n    <label class=\"tm-settings-label\" for=\"tm-response-composer-launcher-zindex\">z-index кнопки</label>\n    <input id=\"tm-response-composer-launcher-zindex\" class=\"tm-zindex-input\" data-zindex-target=\"launcher\" type=\"number\" min=\"0\" max=\"2147483647\" step=\"1\" inputmode=\"numeric\">\n    <label class=\"tm-settings-label\" for=\"tm-response-composer-panel-zindex\">z-index виджета</label>\n    <input id=\"tm-response-composer-panel-zindex\" class=\"tm-zindex-input\" data-zindex-target=\"panel\" type=\"number\" min=\"0\" max=\"2147483647\" step=\"1\" inputmode=\"numeric\">\n    <span class=\"tm-settings-hint\">Значения независимы · 0–2147483647 · сохраняются в браузере</span>\n</div>\n<div class=\"tm-library-panel\">\n    <div class=\"tm-library-row\">\n        <span class=\"tm-label\">Текущий набор</span>\n        <input class=\"tm-library-input tm-current-set-name\" type=\"text\" maxlength=\"120\" placeholder=\"Например: Изучение\">\n        <button class=\"tm-btn\" data-action=\"new-set\" type=\"button\">Новый набор</button>\n        <button class=\"tm-btn\" data-action=\"save-set\" type=\"button\">Сохранить набор</button>\n    </div>\n    <div class=\"tm-library-row\">\n        <span class=\"tm-label\">Наборы</span>\n        <select class=\"tm-library-select tm-saved-sets-select\"></select>\n        <button class=\"tm-btn\" data-action=\"load-set\" type=\"button\">Загрузить</button>\n        <button class=\"tm-btn\" data-action=\"rename-set\" type=\"button\">Переименовать</button>\n        <button class=\"tm-btn\" data-action=\"delete-set\" type=\"button\">Удалить</button>\n    </div>\n    <div class=\"tm-library-row\">\n        <span class=\"tm-label\">Части</span>\n        <select class=\"tm-library-select tm-part-templates-select\"></select>\n        <button class=\"tm-btn\" data-action=\"add-template-part\" type=\"button\">Добавить часть</button>\n        <button class=\"tm-btn\" data-action=\"rename-template\" type=\"button\">Переименовать</button>\n        <button class=\"tm-btn\" data-action=\"delete-template\" type=\"button\">Удалить</button>\n    </div>\n    <div class=\"tm-library-hint\">Шаблоны и наборы сохраняют только названия частей и инструкции. Текст ответа, изображения и файлы в библиотеку не попадают.</div>\n</div>\n<div class=\"tm-sections\"></div>\n<div class=\"tm-footer\">\n    <span class=\"tm-status\">Черновик сохраняется локально. Ctrl+V вставляет изображение; файлы можно добавить кнопкой.</span>\n</div>\n";
    const SECTION_HTML = "<div class=\"tm-section-header\">\n    <div class=\"tm-section-drag-handle\" draggable=\"true\" title=\"Перетащить часть\" aria-label=\"Перетащить часть\">⋮⋮</div>\n    <span class=\"tm-section-index\"></span>\n    <input class=\"tm-section-name-input\" type=\"text\" maxlength=\"120\" placeholder=\"Название части\" aria-label=\"Название части\">\n    <button class=\"tm-icon-btn\" data-action=\"save-part-template\" title=\"Сохранить эту часть как шаблон\">☆</button>\n    <button class=\"tm-icon-btn\" data-action=\"up\" title=\"Выше\">↑</button>\n    <button class=\"tm-icon-btn\" data-action=\"down\" title=\"Ниже\">↓</button>\n    <button class=\"tm-icon-btn\" data-action=\"duplicate\" title=\"Дублировать\">⧉</button>\n    <button class=\"tm-icon-btn tm-delete\" data-action=\"delete\" title=\"Удалить\">×</button>\n</div>\n<div class=\"tm-section-content\">\n    <div class=\"tm-row\">\n        <button class=\"tm-instructions-toggle\" data-action=\"toggle-instructions\" type=\"button\">Инструкции</button>\n        <button class=\"tm-btn\" data-action=\"insert-file\" type=\"button\" title=\"Добавить один или несколько файлов и вставить ссылки в текст\">+ Файл</button>\n        <input class=\"tm-file-input\" type=\"file\" multiple>\n    </div>\n    <div class=\"tm-instructions-wrap\">\n        <textarea class=\"tm-instructions\" placeholder=\"Будут вставлены в самом начале этой части...\"></textarea>\n    </div>\n    <div class=\"tm-label\">Текст / изображения / файлы</div>\n    <div class=\"tm-editor\" contenteditable=\"true\" spellcheck=\"true\"></div>\n</div>\n";

    // ---- src/js/00-state.js ----
    // Runtime state and constants.
    const images = new Map();
    const attachments = new Map();
    let sectionCounter = 0;
    let imageCounter = 0;
    let attachmentCounter = 0;
    let statusTimer = null;
    let draftSaveTimer = null;
    let imageGcTimer = null;
    let panelMovedSinceOpen = false;
    let draggedSection = null;

    const STORAGE_KEYS = {
        launcherPosition: 'tm-response-composer-launcher-position-v1',
        panelSize: 'tm-response-composer-panel-size-v1',
        draft: 'tm-response-composer-draft-v2',
        uiSettings: 'tm-response-composer-ui-settings-v1',
        partTemplates: 'tm-response-composer-part-templates-v1',
        savedSets: 'tm-response-composer-saved-sets-v1'
    };

    const DB_NAME = 'tm-response-composer-db';
    const DB_VERSION = 1;
    const IMAGE_STORE = 'images';

    const DEFAULT_PANEL_SIZE = { width: 540, height: 720 };
    const MIN_PANEL_SIZE = { width: 380, height: 340 };
    const EDGE_MARGIN = 8;
    const DEFAULT_Z_INDEX = 2147483000;
    const MIN_Z_INDEX = 0;
    const MAX_Z_INDEX = 2147483647;

    // ---- src/js/10-ui-shell.js ----
    // Create the launcher/panel DOM and cache frequently used elements.
    const style = document.createElement('style');
    style.textContent = APP_CSS;
    document.head.appendChild(style);

    const launcher = document.createElement('button');
    launcher.id = 'tm-response-composer-launcher';
    launcher.type = 'button';
    launcher.textContent = 'RC';
    launcher.title = 'Response Composer — нажать, чтобы открыть; перетащить, чтобы переместить';
    document.body.appendChild(launcher);

    const panel = document.createElement('div');
    panel.id = 'tm-response-composer';
    panel.innerHTML = PANEL_HTML;
    document.body.appendChild(panel);

    const header = panel.querySelector('.tm-header');
    const settingsPanel = panel.querySelector('.tm-settings-panel');
    const libraryPanel = panel.querySelector('.tm-library-panel');
    const currentSetTitle = panel.querySelector('.tm-current-set-title');
    const currentSetNameInput = panel.querySelector('.tm-current-set-name');
    const savedSetsSelect = panel.querySelector('.tm-saved-sets-select');
    const partTemplatesSelect = panel.querySelector('.tm-part-templates-select');
    const launcherZIndexInput = panel.querySelector('[data-zindex-target="launcher"]');
    const panelZIndexInput = panel.querySelector('[data-zindex-target="panel"]');
    const sectionsContainer = panel.querySelector('.tm-sections');
    const status = panel.querySelector('.tm-status');

    // ---- src/js/20-layout-storage.js ----
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

    // ---- src/js/30-blob-store.js ----
    // IndexedDB persistence for binary blobs (images and attached files).
    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(IMAGE_STORE)) {
                    db.createObjectStore(IMAGE_STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function dbPutImage(imageId, blob) {
        try {
            const db = await openDb();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(IMAGE_STORE, 'readwrite');
                tx.objectStore(IMAGE_STORE).put(blob, imageId);
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
            db.close();
        } catch (error) {
            console.warn('[Response Composer] IndexedDB save failed:', error);
        }
    }

    async function dbGetImage(imageId) {
        try {
            const db = await openDb();
            const blob = await new Promise((resolve, reject) => {
                const tx = db.transaction(IMAGE_STORE, 'readonly');
                const request = tx.objectStore(IMAGE_STORE).get(imageId);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
            db.close();
            return blob;
        } catch (error) {
            console.warn('[Response Composer] IndexedDB read failed:', error);
            return null;
        }
    }

    async function dbDeleteImage(imageId) {
        try {
            const db = await openDb();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(IMAGE_STORE, 'readwrite');
                tx.objectStore(IMAGE_STORE).delete(imageId);
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
            db.close();
        } catch (error) {
            console.warn('[Response Composer] IndexedDB delete failed:', error);
        }
    }

    // ---- src/js/40-library-draft.js ----
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

    // ---- src/js/50-sections.js ----
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

    // ---- src/js/60-editor-attachments.js ----
    // Clipboard/editor insertion, image/file persistence and garbage collection.
    function extensionFromMime(mime) {
        switch (mime) {
            case 'image/jpeg': return 'jpg';
            case 'image/webp': return 'webp';
            case 'image/gif': return 'gif';
            case 'image/bmp': return 'bmp';
            case 'image/png':
            default: return 'png';
        }
    }

    function getSelectionRangeInside(editor) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        if (!editor.contains(node) && node !== editor) return null;
        return range;
    }

    function insertNodesAtCursor(editor, nodes) {
        editor.focus();
        const selection = window.getSelection();
        let range = getSelectionRangeInside(editor);

        if (!range) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
        }

        range.deleteContents();
        let lastNode = null;
        for (const node of nodes) {
            range.insertNode(node);
            range.setStartAfter(node);
            range.collapse(true);
            lastNode = node;
        }

        if (selection && lastNode) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    function insertPlainText(editor, text) {
        if (text) insertNodesAtCursor(editor, [document.createTextNode(text)]);
    }

    async function createImageRecord(blob) {
        imageCounter++;
        const imageId = `img-${Date.now()}-${imageCounter}`;
        const objectUrl = URL.createObjectURL(blob);
        const record = {
            blob,
            mime: blob.type || 'image/png',
            extension: extensionFromMime(blob.type),
            objectUrl
        };
        images.set(imageId, record);
        await dbPutImage(imageId, blob);
        return { imageId, objectUrl };
    }

    async function insertImage(editor, blob) {
        const { imageId, objectUrl } = await createImageRecord(blob);
        const img = document.createElement('img');
        img.src = objectUrl;
        img.dataset.imageId = imageId;
        img.alt = 'Вставленное изображение';
        img.contentEditable = 'false';
        insertNodesAtCursor(editor, [img, document.createTextNode('\n')]);
        scheduleDraftSave();
        return imageId;
    }

    function safeOriginalFileName(name) {
        const cleaned = String(name || 'file')
            .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^\.+|\.+$/g, '');
        const fallback = cleaned || 'file';
        if (fallback.length <= 140) return fallback;

        const dot = fallback.lastIndexOf('.');
        if (dot > 0 && fallback.length - dot <= 16) {
            const extension = fallback.slice(dot);
            return fallback.slice(0, 140 - extension.length) + extension;
        }
        return fallback.slice(0, 140);
    }

    async function createAttachmentRecord(file) {
        attachmentCounter++;
        const fileId = `file-${Date.now()}-${attachmentCounter}`;
        const originalName = safeOriginalFileName(file.name || 'file');
        const blob = file instanceof Blob ? file : new Blob([file]);
        const record = {
            blob,
            mime: blob.type || 'application/octet-stream',
            originalName
        };
        attachments.set(fileId, record);
        await dbPutImage(fileId, blob);
        return { fileId, originalName };
    }

    async function insertAttachment(editor, file) {
        const { fileId, originalName } = await createAttachmentRecord(file);
        const link = document.createElement('a');
        link.href = '#';
        link.dataset.fileId = fileId;
        link.dataset.fileName = originalName;
        link.textContent = originalName;
        link.title = `Файл будет включён в ZIP: ${originalName}`;
        link.contentEditable = 'false';
        link.addEventListener('click', event => event.preventDefault());
        insertNodesAtCursor(editor, [link, document.createTextNode('\n')]);
        scheduleDraftSave();
        return fileId;
    }

    async function handlePaste(event, editor) {
        const clipboard = event.clipboardData;
        if (!clipboard) return;

        const items = [...clipboard.items];
        const imageItems = items.filter(item => item.kind === 'file' && item.type.startsWith('image/'));
        const fileItems = items.filter(item => item.kind === 'file' && !item.type.startsWith('image/'));
        const plainText = clipboard.getData('text/plain');

        if (imageItems.length || fileItems.length || plainText) event.preventDefault();
        if (plainText) insertPlainText(editor, plainText);

        if ((imageItems.length || fileItems.length) && plainText && !plainText.endsWith('\n')) {
            insertPlainText(editor, '\n');
        }

        let insertedImages = 0;
        for (const item of imageItems) {
            const blob = item.getAsFile();
            if (!blob) continue;
            await insertImage(editor, blob);
            insertedImages++;
        }

        let insertedFiles = 0;
        for (const item of fileItems) {
            const file = item.getAsFile();
            if (!file) continue;
            await insertAttachment(editor, file);
            insertedFiles++;
        }

        if (insertedImages || insertedFiles) {
            const parts = [];
            if (insertedImages) parts.push(`изображений: ${insertedImages}`);
            if (insertedFiles) parts.push(`файлов: ${insertedFiles}`);
            setStatus(`Добавлено ${parts.join(', ')}`);
        }

        scheduleDraftSave();
    }

    function collectReferencedImageIds() {
        return new Set(
            [...sectionsContainer.querySelectorAll('img[data-image-id]')]
                .map(img => img.dataset.imageId)
                .filter(Boolean)
        );
    }

    function collectReferencedAttachmentIds() {
        return new Set(
            [...sectionsContainer.querySelectorAll('a[data-file-id]')]
                .map(link => link.dataset.fileId)
                .filter(Boolean)
        );
    }

    async function garbageCollectImages() {
        const referencedImages = collectReferencedImageIds();
        const referencedAttachments = collectReferencedAttachmentIds();
        const deletions = [];

        for (const [imageId, image] of images.entries()) {
            if (!referencedImages.has(imageId)) {
                URL.revokeObjectURL(image.objectUrl);
                images.delete(imageId);
                deletions.push(dbDeleteImage(imageId));
            }
        }

        for (const fileId of [...attachments.keys()]) {
            if (!referencedAttachments.has(fileId)) {
                attachments.delete(fileId);
                deletions.push(dbDeleteImage(fileId));
            }
        }

        await Promise.allSettled(deletions);
    }

    async function restorePersistedImages() {
        const imageIds = collectReferencedImageIds();
        for (const imageId of imageIds) {
            if (images.has(imageId)) continue;
            const blob = await dbGetImage(imageId);
            if (!blob) continue;
            const objectUrl = URL.createObjectURL(blob);
            images.set(imageId, {
                blob,
                mime: blob.type || 'image/png',
                extension: extensionFromMime(blob.type),
                objectUrl
            });
            sectionsContainer.querySelectorAll(`img[data-image-id="${CSS.escape(imageId)}"]`).forEach(img => {
                img.src = objectUrl;
                img.alt = 'Вставленное изображение';
                img.contentEditable = 'false';
            });
        }

        const fileIds = collectReferencedAttachmentIds();
        for (const fileId of fileIds) {
            if (attachments.has(fileId)) continue;
            const blob = await dbGetImage(fileId);
            if (!blob) continue;
            const link = sectionsContainer.querySelector(`a[data-file-id="${CSS.escape(fileId)}"]`);
            const originalName = safeOriginalFileName(link?.dataset.fileName || link?.textContent || 'file');
            attachments.set(fileId, {
                blob,
                mime: blob.type || 'application/octet-stream',
                originalName
            });
            sectionsContainer.querySelectorAll(`a[data-file-id="${CSS.escape(fileId)}"]`).forEach(anchor => {
                anchor.href = '#';
                anchor.dataset.fileName = originalName;
                anchor.textContent = originalName;
                anchor.title = `Файл будет включён в ZIP: ${originalName}`;
                anchor.contentEditable = 'false';
                anchor.onclick = event => event.preventDefault();
            });
        }
    }

    // ---- src/js/70-export.js ----
    // Convert editor DOM to Markdown and export response + binary files as ZIP.
    function normalizeText(text) {
        return text
            .replace(/\u00A0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n');
    }

    function editorToMarkdown(editor, resolveImage, resolveFile) {
        let result = '';

        function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent || '';
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const tag = node.tagName;
            if (tag === 'IMG') {
                const imageId = node.dataset.imageId;
                const resolved = imageId ? resolveImage(imageId) : null;
                if (resolved) {
                    if (result && !result.endsWith('\n')) result += '\n';
                    result += `![image](${resolved})\n`;
                }
                return;
            }
            if (tag === 'A' && node.dataset.fileId) {
                const fileId = node.dataset.fileId;
                const originalName = safeOriginalFileName(node.dataset.fileName || node.textContent || 'file');
                const resolved = resolveFile ? resolveFile(fileId, originalName) : null;
                if (resolved) {
                    if (result && !result.endsWith('\n')) result += '\n';
                    const label = originalName.replace(/[\[\]]/g, '_');
                    result += `[${label}](${resolved})\n`;
                }
                return;
            }
            if (tag === 'BR') {
                result += '\n';
                return;
            }

            const blockTags = new Set(['DIV', 'P', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'PRE']);
            const isBlock = blockTags.has(tag);
            if (isBlock && result && !result.endsWith('\n')) result += '\n';
            for (const child of node.childNodes) walk(child);
            if (isBlock && !result.endsWith('\n')) result += '\n';
        }

        for (const child of editor.childNodes) walk(child);
        return normalizeText(result).trim();
    }

    function pad3(value) {
        return String(value).padStart(3, '0');
    }

    function buildExportPlan() {
        const sections = [...sectionsContainer.querySelectorAll('.tm-section')];
        const usedFiles = [];
        let output = '';

        const setName = currentSetNameInput.value.trim();
        if (setName) output += `<!-- SET: ${escapeCommentText(setName)} -->\n\n`;

        sections.forEach((section, sectionIndex) => {
            const partNumber = sectionIndex + 1;
            const partName = getSectionName(section, sectionIndex);
            const editor = section.querySelector('.tm-editor');
            const instructions = section.querySelector('.tm-instructions').value.trim();
            let imageNumberInPart = 0;
            let fileNumberInPart = 0;

            const resolveImage = imageId => {
                const image = images.get(imageId);
                if (!image) return null;
                imageNumberInPart++;
                const fileName = `part-${pad3(partNumber)}-image-${pad3(imageNumberInPart)}.${image.extension}`;
                usedFiles.push({ fileName, image, kind: 'image' });
                return `images/${fileName}`;
            };

            const resolveFile = (fileId, originalName) => {
                const attachment = attachments.get(fileId);
                if (!attachment) return null;
                fileNumberInPart++;
                const safeName = safeOriginalFileName(originalName || attachment.originalName || 'file');
                const fileName = `part-${pad3(partNumber)}-file-${pad3(fileNumberInPart)}-${safeName}`;
                usedFiles.push({ fileName, attachment, kind: 'attachment' });
                return `files/${encodeURIComponent(fileName)}`;
            };

            const body = editorToMarkdown(editor, resolveImage, resolveFile);
            output += `<part index="${partNumber}" name="${escapeXmlAttribute(partName)}">\n`;
            output += `<instructions>\n${instructions}\n</instructions>\n\n`;
            output += `<content>\n${body}\n</content>\n`;
            output += `</part>\n\n`;
        });

        return {
            markdown: output.trimEnd() + '\n',
            usedFiles,
            partCount: sections.length
        };
    }

    async function exportZip() {
        const sections = [...sectionsContainer.querySelectorAll('.tm-section')];
        if (!sections.length) {
            setStatus('Нечего экспортировать.');
            return;
        }

        saveDraftNow();
        await garbageCollectImages();
        const plan = buildExportPlan();
        const zip = new JSZip();
        zip.file('response.md', plan.markdown);

        if (plan.usedFiles.length) {
            const imagesFolder = zip.folder('images');
            const filesFolder = zip.folder('files');
            for (const file of plan.usedFiles) {
                if (file.kind === 'attachment') {
                    filesFolder.file(file.fileName, file.attachment.blob);
                } else {
                    imagesFolder.file(file.fileName, file.image.blob);
                }
            }
        }

        try {
            setStatus('Формирование ZIP…', 10000);
            const archive = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            const now = new Date();
            const stamp =
                `${now.getFullYear()}` +
                `${String(now.getMonth() + 1).padStart(2, '0')}` +
                `${String(now.getDate()).padStart(2, '0')}-` +
                `${String(now.getHours()).padStart(2, '0')}` +
                `${String(now.getMinutes()).padStart(2, '0')}` +
                `${String(now.getSeconds()).padStart(2, '0')}`;

            const url = URL.createObjectURL(archive);
            const a = document.createElement('a');
            a.href = url;
            a.download = `response-${stamp}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setStatus(`ZIP готов: ${plan.partCount} частей, ${plan.usedFiles.filter(file => file.kind === 'image').length} изображений, ${plan.usedFiles.filter(file => file.kind === 'attachment').length} файлов.`);
        } catch (error) {
            console.error('[Response Composer] export error:', error);
            setStatus('Ошибка формирования ZIP. Смотрите консоль браузера.');
        }
    }

    // ---- src/js/80-actions.js ----
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

    // ---- src/js/90-lifecycle.js ----
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
})();
