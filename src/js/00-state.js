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
