# ChatGPT Response Composer — development project

Исходник разделён на небольшие файлы, но результатом сборки остаётся один обычный Tampermonkey userscript.

## Сборка

Требуется только Node.js. Сторонние npm-пакеты для сборки не нужны.

```bash
node build.mjs
```

или:

```bash
npm run build
```

В Windows можно запустить `build.cmd` двойным кликом.

Результат:

```text
dist/chatgpt-response-composer.user.js
```

`build.mjs` после сборки автоматически запускает `node --check` и завершится с ошибкой, если итоговый JavaScript синтаксически некорректен.

## Структура

```text
project.json                     метаданные userscript, версия, порядок модулей
build.mjs                        сборщик без внешних зависимостей
src/styles.css                   стили виджета
src/templates/panel.html         HTML основного виджета
src/templates/section.html       HTML одной части
src/js/00-state.js               состояние и константы
src/js/10-ui-shell.js            создание DOM и ссылки на элементы
src/js/20-layout-storage.js      localStorage, z-index, размеры/позиция, drag окна
src/js/30-blob-store.js          IndexedDB для изображений и файлов
src/js/40-library-draft.js       библиотека шаблонов/наборов и автосохранение черновика
src/js/50-sections.js            создание и drag&drop частей
src/js/60-editor-attachments.js  редактор, clipboard, изображения и вложения
src/js/70-export.js              Markdown и ZIP-экспорт
src/js/80-actions.js             команды и маршрутизация кнопок
src/js/90-lifecycle.js           восстановление и lifecycle
```

## Принцип сборки

Tampermonkey удобнее получать как один файл, поэтому исходные JS-файлы являются build-time модулями и собираются в общий IIFE. Они намеренно работают в одной closure: это сохраняет простой runtime без собственного module-loader и без дополнительных `@require` для локальных файлов.

CSS и HTML вынесены из JavaScript и при сборке автоматически превращаются в строковые константы. Версия и metadata userscript задаются один раз в `project.json`.

## Как развивать

1. Менять соответствующий файл в `src/`.
2. При необходимости обновить `version` в `project.json` и `package.json`.
3. Запустить `node build.mjs`.
4. Установить/обновить `dist/chatgpt-response-composer.user.js` в Tampermonkey.

Локальные ключи `localStorage` и имя IndexedDB не менялись относительно v0.8.0, поэтому существующие черновики, библиотека и настройки должны продолжить использоваться.
