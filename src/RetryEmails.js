import { openDB } from 'idb';
import emailjs from 'emailjs-com';

export const retryPendingEmails = async () => {
    const db = await openDB('AppDatabase', 1);
    const emails = await db.getAll('emails');

    for (const email of emails) {
        try {
            await sendEmail(email.code, email.localNumber);
            await db.delete('emails', email.id);
        } catch (error) {
            console.error("Failed to send email:", error);
        }
    }
};

const sendEmail = async (code, localNumber) => {
    const templateParams = {
        code: code,
        localNumber: localNumber,
    };

    return emailjs.send('service_159lgyl', 'template_qouw3so', templateParams, 'cataYOEwOQrXCUnMT');
};