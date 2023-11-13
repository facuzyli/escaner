import { sendEmail } from './ScannerComponent';
import { emailStatus } from './index.js';
const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;


// Función para guardar un correo electrónico en IndexedDB si no se pudo enviar
export const storeEmail = (code, localNumber, store) => {
    console.log("Storing email with code:", code, "and localNumber:", localNumber, "and store:", store);
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
        storeDB.add({ code: code, localNumber: localNumber, store: store }).onsuccess = () => {
            emailStatus.stored = true;
            console.log("Stored email with code:", code, "and localNumber:", localNumber, "and store:", store);
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
            //luego de aca me manda el error
            const transaction = db.transaction(["emails"], "readwrite");
            const store = transaction.objectStore("emails");
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function() {
                console.log("Fetched pending emails:", getAllRequest.result);
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
export const deleteEmailByCodeAndLocalNumber = (code, localNumber, store) => {
    console.log("Deleting email with code:", code, "and localNumber:", localNumber, "and store:", store);
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("AppDatabases", 1);

        openRequest.onsuccess = function(e) {
            const db = e.target.result;
            const transaction = db.transaction(["emails"], "readwrite");
            const store = transaction.objectStore("emails");
            
            // Crear un cursor para buscar el registro basado en code y localNumber
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.code === code && cursor.value.localNumber === localNumber) {
                        // Si encontramos el registro correcto, lo eliminamos
                        const deleteRequest = cursor.delete();
                        deleteRequest.onsuccess = function() {
                            console.log("Deleted email with code:", code, "and localNumber:", localNumber);
                            resolve();
                        };
                        deleteRequest.onerror = function() {
                            reject(new Error("Error deleting email from IndexedDB."));
                        };
                    } else {
                        // Si no es el registro correcto, continuamos con el siguiente
                        cursor.continue();
                    }
                } else {
                    // No encontramos el registro
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
    console.log("retryPendingEmails triggered");
    const pendingEmails = await getPendingEmails();
    console.log("Correos electrónicos pendientes:", pendingEmails);
    for (let email of pendingEmails) {
        
        // Envio mails pendientes
        await sendEmail(email.code, email.localNumber, email.store);
        // Si el correo electrónico se envía con éxito, elimínalo de IndexedDB
        await deleteEmailByCodeAndLocalNumber(email.code, email.localNumber, email.store);

        
    }
};