import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import emailjs from 'emailjs-com';

function ScannerComponent() {
    const [scannedCode, setScannedCode] = useState('');
    const [localNumber, setLocalNumber] = useState(''); // Estado para el número de local
    let scanner;

    const onScanSuccess = (decodedText, decodedResult) => {
        if (!scannedCode) {
            setScannedCode(decodedText);
            const localNumber = document.getElementById('localNumberInput').value;
            sendEmail(decodedText, localNumber); // Pasar el número de local a la función sendEmail
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
                alert(`La entrega fue notificada. Código de barras: ${localNumber}`);
            }, (error) => {
                alert('Error al enviar el correo:', error);
            });
    };

    useEffect(() => {
        const config = { fps: 10, qrbox: 250, formats: ["CODE_39"] };
        scanner = new Html5QrcodeScanner("reader", config);
        scanner.render(onScanSuccess, onScanError);
        
        return () => {
            scanner.clear();
        };
    }, [scannedCode]);

    const updateButtonLabels = () => {
        const requestCameraButton = document.querySelector('.qr-scanner__request-camera-permissions');
        const scanImageButton = document.querySelector('.qr-scanner__scan-an-image-file');
        
        if (requestCameraButton) {
            requestCameraButton.textContent = 'Tu nuevo texto para Request Camera Permissions';
        }
    
        if (scanImageButton) {
            scanImageButton.textContent = 'Tu nuevo texto para Scan an Image File';
        }
    };

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