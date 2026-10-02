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
