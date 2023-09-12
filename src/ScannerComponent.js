import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import emailjs from 'emailjs-com';
import { openDB } from 'idb';

function ScannerComponent() {
    // Estados para el código escaneado y el número de local.
    const [scannedCode, setScannedCode] = useState('');
    const [localNumber, setLocalNumber] = useState('');
    let scanner;

    // Función que se ejecuta cuando se escanea un código con éxito.
    const onScanSuccess = async (decodedText, decodedResult) => {
        if (!scannedCode) {
            setScannedCode(decodedText);
            const localNum = document.getElementById('localNumberInput').value;
            try {
                // Intenta enviar el correo.
                await sendEmail(decodedText, localNum);
                alert(`La entrega fue notificada. Código de barras: ${decodedText}`);
            } catch (error) {
                // Si falla el envío, guarda el correo para intentar enviarlo más tarde.
                console.error("Failed to send email, saving for later:", error);
                await saveEmailForLater(decodedText, localNum);
                alert("Estás desconectado. El correo se enviará automáticamente cuando vuelvas a estar en línea.");
            }
        }
    };

    // Función que se ejecuta cuando hay un error al escanear.
    const onScanError = (error) => {
        console.error(`Error during scanning: ${error}`);
    };

    // Función para enviar el correo.
    const sendEmail = async (code, localNumber) => {
        const templateParams = {
            code: code,
            localNumber: localNumber,
        };

        return emailjs.send('service_159lgyl', 'template_qouw3so', templateParams, 'cataYOEwOQrXCUnMT');
    };

    // Función para guardar correos pendientes en IndexedDB.
    const saveEmailForLater = async (code, localNumber) => {
        const db = await openDB('AppDatabase', 1, {
            upgrade(db) {
                db.createObjectStore('emails', {
                    autoIncrement: true,
                });
            },
        });

        const tx = db.transaction('emails', 'readwrite');
        await tx.store.add({
            code: code,
            localNumber: localNumber,
        });
        await tx.done;
    };

    // Función para reintentar enviar correos pendientes cuando se restablece la conexión.
    const retryPendingEmails = async () => {
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

    useEffect(() => {
        // Configuración del escáner.
        const config = { fps: 10, qrbox: 250, formats: ["CODE_39"] };
        scanner = new Html5QrcodeScanner("reader", config);
        scanner.render(onScanSuccess, onScanError);

        // Escucha los mensajes del Service Worker para saber cuándo se restablece la conexión.
        const handleServiceWorkerMessage = (event) => {
            if (event.data === 'online') {
                retryPendingEmails();
            }
        };

        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

        return () => {
            scanner.clear();
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, [scannedCode]);

    return (
        <div>
            <div>
                <label>Número de Local: </label>
                <input 
                    id="localNumberInput"
                    type="text" 
                    value={localNumber} 
                    onChange={(e) => setLocalNumber(e.target.value)} 
                />
            </div>
            <div id="reader"></div>
            <p>Código escaneado: {scannedCode}</p>
            {scannedCode && <button onClick={() => {
                setScannedCode('');
                scanner.render(onScanSuccess, onScanError);
            }}>Reiniciar escáner</button>}
        </div>
    );
}

export default ScannerComponent;