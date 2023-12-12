import { sendToAPI } from './ScannerComponent';

// Función para guardar un correo electrónico en localStorage si no se pudo enviar
export const storeEmail = (code, scanDateTime) => {
    try {
        const emails = JSON.parse(localStorage.getItem('emails')) || [];
        emails.push({ code, scanDateTime });
        localStorage.setItem('emails', JSON.stringify(emails));
        console.log("Correo guardado en localStorage:", { code, scanDateTime });
    } catch (error) {
        console.error("Error al guardar el correo en localStorage:", error);
    }
};

// Función para obtener todos los correos electrónicos pendientes
export const getPendingEmails = () => {
    try {
        return JSON.parse(localStorage.getItem('emails')) || [];
    } catch (error) {
        console.error("Error al obtener correos de localStorage:", error);
        return [];
    }
};

// Función para eliminar un correo electrónico específico después de enviarlo con éxito
export const deleteEmailByCode = async (code, scanDateTime) => {
    try {
        const emails = JSON.parse(localStorage.getItem('emails')) || [];
        const updatedEmails = emails.filter(email => email.code !== code || email.scanDateTime !== scanDateTime);
        localStorage.setItem('emails', JSON.stringify(updatedEmails));
        console.log("Correo eliminado de localStorage:", { code, scanDateTime });
    } catch (error) {
        console.error("Error al eliminar correo de localStorage:", error);
    }
};

// Función para reintentar enviar correos electrónicos pendientes
export const retryPendingEmails = async () => {
    const pendingEmails = getPendingEmails();
    console.log("Reintentando enviar correos pendientes:", pendingEmails);

    for (let email of pendingEmails) {
        try {
            await sendToAPI(email.code, email.scanDateTime);
            await deleteEmailByCode(email.code, email.scanDateTime);
        } catch (error) {
            console.error("Error al reintentar enviar correo:", error);
        }
    }
};