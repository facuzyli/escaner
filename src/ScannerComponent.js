import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import emailjs from 'emailjs-com';
import { storeEmail, retryPendingEmails } from './RetryEmails';

export const sendEmail = (code, localNumber) => {
    console.log("sendEmail triggered with code:", code);
    const templateParams = {
        code: code,
        localNumber: localNumber,
    };

    emailjs.send('service_159lgyl', 'template_qouw3so', templateParams, 'cataYOEwOQrXCUnMT')
        .then((response) => {
            alert(`La entrega fue notificada. Código de barras: ${code}`);
        }, (error) => {
            alert('Error al enviar el correo. Se intentará enviar más tarde.');
            storeEmail(code, localNumber);
        });
};

function ScannerComponent() {
    const [scannedCode, setScannedCode] = useState('');
    const [localNumber, setLocalNumber] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    let scanner;

    const onScanSuccess = (decodedText) => {
        
        console.log("onScanSuccess triggered with code:", decodedText);
        if (!scannedCode && !emailSent) {
            
            setScannedCode(decodedText);
            const localNumber = document.getElementById('localNumberInput').value;
            sendEmail(decodedText, localNumber);
            setEmailSent(true); // Marcar el correo electrónico como enviado
            setTimeout(() => setEmailSent(false), 5000); // Restablecer después de 5 segundos
            
        }
    };

    const onScanError = (error) => {
        console.error(`Error during scanning: ${error}`);
    };

    

    useEffect(() => {
        if (isScanning) {
            console.log("Scanner started");
            const config = { fps: 10, qrbox: 250, formats: ["CODE_39"] };
            scanner = new Html5QrcodeScanner("reader", config);
            scanner.render(onScanSuccess, onScanError);
            
            return () => {
                scanner.clear();
            };
        }
    }, [scannedCode, isScanning]);

    useEffect(() => {
        const handleOnline = async () => {
            console.log("Evento online detectado. Intentando reenviar correos pendientes...");
            try {
                await retryPendingEmails();
                console.log("Reenvío de correos pendientes completado.", retryPendingEmails);
                alert('Todos los correos electrónicos pendientes se han enviado con éxito.');
            } catch (error) {
                console.error("Error al reenviar correos:", error.message, error);
                alert('Ocurrió un error al intentar enviar correos electrónicos pendientes.');
            }
        };
        
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);
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
            {!isScanning && <button onClick={() => setIsScanning(true)}>Iniciar escáner</button>}
            {scannedCode && <button onClick={() => {
                setScannedCode('');
                setIsScanning(false);
            }}>Reiniciar escáner</button>}
        </div>
    );
}

export default ScannerComponent;