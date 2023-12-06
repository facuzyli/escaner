import { sendToAPI } from './ScannerComponent';
import { emailStatus } from './index.js';
const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

// Función para guardar un correo electrónico en IndexedDB si no se pudo enviar
export const storeEmail = (code, scanDateTime) => {
    const openRequest = indexedDB.open("AppDatabases", 1);

    openRequest.onupgradeneeded = function() {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains("emails")) {
            db.createObjectStore("emails", { keyPath: "id", autoIncrement: true });
        }
    };

    openRequest.onsuccess = function() {
        const db = openRequest.result;
        const transaction = db.transaction(["emails"], "readwrite");
        const storeDB = transaction.objectStore("emails");
        storeDB.add({ code, scanDateTime }).onsuccess = () => {
            emailStatus.stored = true;
        };
    };

    openRequest.onerror = function() {
        console.error("Error", openRequest.error);
    };
};

// Función para obtener todos los correos electrónicos pendientes
export const getPendingEmails = () => {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("AppDatabases", 1);

        openRequest.onsuccess = function(e) {
            const db = e.target.result;
            const transaction = db.transaction(["emails"], "readonly");
            const storeDB = transaction.objectStore("emails");
            const getAllRequest = storeDB.getAll();

            getAllRequest.onsuccess = function() {
                resolve(getAllRequest.result);
            };

            getAllRequest.onerror = function() {
                reject(new Error("Error fetching pending emails from IndexedDB."));
            };
        };

        openRequest.onerror = function() {
            reject(new Error("Error opening IndexedDB."));
        };
    });
};

// Función para eliminar un correo electrónico específico después de enviarlo con éxito
export const deleteEmailByCode = (code, scanDateTime) => {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("AppDatabases", 1);

        openRequest.onsuccess = function(e) {
            const db = e.target.result;
            const transaction = db.transaction(["emails"], "readwrite");
            const storeDB = transaction.objectStore("emails");
            
            const cursorRequest = storeDB.openCursor();

            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.code === code && cursor.value.scanDateTime === scanDateTime) {
                        const deleteRequest = cursor.delete();
                        deleteRequest.onsuccess = function() {
                            resolve();
                        };
                        deleteRequest.onerror = function() {
                            reject(new Error("Error deleting email from IndexedDB."));
                        };
                    } else {
                        cursor.continue();
                    }
                } else {
                    reject(new Error("Email not found in IndexedDB."));
                }
            };

            cursorRequest.onerror = function() {
                reject(new Error("Error opening cursor in IndexedDB."));
            };
        };

        openRequest.onerror = function() {
            reject(new Error("Error opening IndexedDB."));
        };
    });
};

// Función para reintentar enviar correos electrónicos pendientes
export const retryPendingEmails = async () => {
    const pendingEmails = await getPendingEmails();
    for (let email of pendingEmails) {
        await sendToAPI(email.code, email.scanDateTime);
        await deleteEmailByCode(email.code, email.scanDateTime);
    }
};