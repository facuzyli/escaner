import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import emailjs from 'emailjs-com';
import { storeEmail, retryPendingEmails } from './RetryEmails';

export const sendEmail = (code, localNumber) => {
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
    let scanner; // Declaración de scanner

    const onScanSuccess = (decodedText) => {
        const userConfirmation = window.confirm(`Tu código es el: ${decodedText}. ¿Deseas enviar el correo?`);
        if (userConfirmation) {
            sendEmail(decodedText, localNumber);
            setScannedCode(decodedText);
            setScannedCode(''); // Limpiar el código escaneado
        } else {
            setScannedCode(''); // Limpiar el código escaneado
            setIsScanning(true);
        }
    };

    const onScanError = (error) => {
        console.error(`Error during scanning: ${error}`);
    };

    const startScanning = () => {
        if (localNumber && Number.isInteger(Number(localNumber))) {
            setIsScanning(true);
        } else {
            alert('Por favor, ingrese un número de local válido.');
        }
    };

    useEffect(() => {
        if (isScanning) {
            const config = { fps: 10, qrbox: 250, formats: ["CODE_39"] };
            scanner = new Html5QrcodeScanner("reader", config);
            scanner.render(onScanSuccess, onScanError);
        }
    }, [scannedCode, isScanning]);

    return (
        <div>
            <div>
                <label>Número de Local: </label>
                <input 
                    id="localNumberInput"
                    type="number" 
                    value={localNumber} 
                    onChange={(e) => setLocalNumber(e.target.value)} 
                />
            </div>
            <div id="reader"></div>
            <p>Código escaneado: {scannedCode}</p>
            {!isScanning && <button onClick={startScanning}>Iniciar escáner</button>}
            {scannedCode && <button onClick={() => {
                setScannedCode('');
                setIsScanning(false);
            }}>Reiniciar escáner</button>}
        </div>
    );
}

export default ScannerComponent;