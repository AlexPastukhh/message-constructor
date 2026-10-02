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
