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
