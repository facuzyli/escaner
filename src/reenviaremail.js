// Importamos la biblioteca emailjs
import emailjs from 'emailjs-com';

// Función para enviar el correo.
const sendEmail = async (code, localNumber) => {
    const templateParams = {
        code: code,
        localNumber: localNumber,
    };

    return emailjs.send('service_159lgyl', 'template_qouw3so', templateParams, 'cataYOEwOQrXCUnMT');
};

// Escuchamos las peticiones POST a este archivo
self.addEventListener('fetch', event => {
    if (event.request.method === 'POST') {
        event.respondWith(
            (async () => {
                const data = await event.request.json();
                const result = await sendEmail(data.code, data.localNumber);
                return new Response(JSON.stringify(result), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })()
        );
    }
});