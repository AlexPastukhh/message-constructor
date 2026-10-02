import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const project = JSON.parse(read('project.json'));

function userscriptHeader(config) {
  const lines = [
    '// ==UserScript==',
    `// @name         ${config.name}`,
    `// @namespace    ${config.namespace}`,
    `// @version      ${config.version}`,
    `// @description  ${config.description}`,
    ...config.matches.map(value => `// @match        ${value}`),
    ...config.requires.map(value => `// @require      ${value}`),
    `// @grant        ${config.grant}`,
    '// ==/UserScript=='
  ];
  return lines.join('\n');
}

function indent(source, spaces = 4) {
  const pad = ' '.repeat(spaces);
  return source
    .replace(/\s+$/u, '')
    .split('\n')
    .map(line => line ? pad + line : '')
    .join('\n');
}

const css = read('src/styles.css').replace(/\r\n/g, '\n');
const panelHtml = read('src/templates/panel.html').replace(/\r\n/g, '\n');
const sectionHtml = read('src/templates/section.html').replace(/\r\n/g, '\n');
const moduleSources = project.modules.map(file => ({ file, source: read(file) }));

const generatedConstants = [
  '// Generated from src/styles.css and src/templates/*.html.',
  `const APP_CSS = ${JSON.stringify(css)};`,
  `const PANEL_HTML = ${JSON.stringify(panelHtml)};`,
  `const SECTION_HTML = ${JSON.stringify(sectionHtml)};`
].join('\n');

const body = [generatedConstants, ...moduleSources.map(({ file, source }) => `// ---- ${file} ----\n${source}`)]
  .map(chunk => indent(chunk))
  .join('\n\n');

const output = `${userscriptHeader(project)}\n\n(function () {\n    'use strict';\n\n${body}\n})();\n`;
const outPath = path.join(ROOT, project.output);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, 'utf8');

const check = spawnSync(process.execPath, ['--check', outPath], { encoding: 'utf8' });
if (check.status !== 0) {
  process.stderr.write(check.stderr || check.stdout || 'Unknown syntax error\n');
  process.exit(check.status || 1);
}

console.log(`Built ${path.relative(ROOT, outPath)} (${Buffer.byteLength(output, 'utf8')} bytes)`);
console.log('Syntax check: OK');
