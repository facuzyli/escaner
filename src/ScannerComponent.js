import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import emailjs from 'emailjs-com';

function ScannerComponent() {
    const [scannedCode, setScannedCode] = useState('');
    const [localNumber, setLocalNumber] = useState(''); // Estado para el número de local
    const [isScanning, setIsScanning] = useState(false); // Estado para saber si el escáner está activo
    const [emailSent, setEmailSent] = useState(false); // Estado para rastrear si el correo electrónico ya se ha enviado
    let scanner;

    const onScanSuccess = (decodedText, decodedResult) => {
        if (!scannedCode && !emailSent) {
            setScannedCode(decodedText);
            const localNumber = document.getElementById('localNumberInput').value;
            sendEmail(decodedText, localNumber); // Pasar el número de local a la función sendEmail
            setEmailSent(true); // Marcar el correo electrónico como enviado
            scanner.stop(); // Detener el escáner
        }
    };

    const onScanError = (error) => {
        console.error(`Error during scanning: ${error}`);
    };

    const sendEmail = (code, localNumber) => {
        const templateParams = {
            code: code,
            localNumber: localNumber,
        };

        emailjs.send('service_159lgyl', 'template_qouw3so', templateParams, 'cataYOEwOQrXCUnMT')
            .then((response) => {
                alert(`La entrega fue notificada. Código de barras: ${code}`);
            }, (error) => {
                alert('Error al enviar el correo:', error);
            });
    };

    useEffect(() => {
        if (isScanning) {
            const config = { fps: 10, qrbox: 250, formats: ["CODE_39"] };
            scanner = new Html5QrcodeScanner("reader", config);
            scanner.render(onScanSuccess, onScanError);
            
            return () => {
                scanner.clear();
            };
        }
    }, [scannedCode, isScanning]);

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
                setEmailSent(false); // Reiniciar el estado de emailSent
                setIsScanning(false);
            }}>Reiniciar escáner</button>}
        </div>
    );
}

export default ScannerComponent;