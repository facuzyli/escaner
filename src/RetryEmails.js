import { sendToAPI } from './ScannerComponent';

// Función para guardar un correo electrónico en localStorage si no se pudo enviar
export const storeEmail = (code, formattedDateTime) => {
    try {
        const emails = JSON.parse(localStorage.getItem('emails')) || [];
        emails.push({ code, formattedDateTime });
        localStorage.setItem('emails', JSON.stringify(emails));
        console.log("Correo guardado en localStorage:", { code, formattedDateTime });
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
export const deleteEmailByCode = async (code, formattedDateTime) => {
    try {
        const emails = JSON.parse(localStorage.getItem('emails')) || [];
        const updatedEmails = emails.filter(email => 
            email.code !== code || email.formattedDateTime !== formattedDateTime
        );
        localStorage.setItem('emails', JSON.stringify(updatedEmails));
        console.log("Correo eliminado de localStorage:", { code, formattedDateTime });
    } catch (error) {
        console.error("Error al eliminar correo de localStorage:", error);
    }
};

// Función para reintentar enviar correos electrónicos pendientes
export const retryPendingEmails = async () => {
    const pendingEmails = getPendingEmails();
    console.log("Reintentando enviar correos pendientes:", pendingEmails);

    for (let email of pendingEmails) {
        console.log("Datos del correo:", email.code, email.formattedDateTime);
        try {
            await sendToAPI(email.code, null, email.formattedDateTime);
            // Eliminar el correo de localStorage solo si se envió con éxito
            await deleteEmailByCode(email.code, email.formattedDateTime);
        } catch (error) {
            console.error("Error al reintentar enviar correo:", error);
        }
    }
};