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
