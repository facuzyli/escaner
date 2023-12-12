import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { storeEmail } from './RetryEmails';


// Función para formatear la fecha y hora en el formato 'ddMMyyyyHHmm'
const formatDateTime = (date) => {
    const pad = (num) => (num < 10 ? '0' + num : num);

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Los meses en JavaScript son de 0 a 11
    const year = date.getFullYear();
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    return `${day}${month}${year}${hour}${minute}`;
};

// Función para enviar el código y la fecha/hora a la API
export const sendToAPI = async (code) => {
    // Obtener la fecha y hora actual
    const currentDateTime = new Date();

    // Formatear la fecha y hora en el formato 'ddMMyyyyHHmm'
    const formattedDateTime = formatDateTime(currentDateTime);

    console.log(`Código: ${code}, Fecha/hora: ${formattedDateTime}`);
    try {
        const response = await fetch(`http://localhost:3000/index.php/CodigoEnvio/${code}/${formattedDateTime}`, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 500) {
                alert('Código ingresado es incorrecto, verifique o comuníquese con central.');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            const result = await response.json();
            alert('Código y fecha/hora enviados a la API con éxito.');
        }
    } catch (error) {
        console.error('Error al conectar con la API:', error);
        alert('Error al enviar el correo. Se intentará enviar más tarde.');
        storeEmail(code, currentDateTime);
    }
};

function ScannerComponent() {
    const [scannedCode, setScannedCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [manualEntry, setManualEntry] = useState(false);
    let scanner;

   
    

    // Función que se llama cuando se escanea un código con éxito
    const onScanSuccess = (decodedText) => {
        setScannedCode(decodedText);
        setIsScanning(false);
        const userConfirmation = window.confirm(`Tu código es el: ${decodedText}. ¿Deseas enviar a la API?`);
        if (userConfirmation) {
            sendToAPI(decodedText);
        }
    };

    // Función que se llama en caso de error durante el escaneo
    const onScanError = (error) => {
        console.error(`Error durante el escaneo: ${error}`);
    };

    // Efecto para inicializar el escáner
    useEffect(() => {
        if (isScanning) {
            const config = { fps: 10, qrbox: 250, formats: ["CODE_39"] };
            scanner = new Html5QrcodeScanner("reader", config);
            scanner.render(onScanSuccess, onScanError);
        }
    }, [isScanning]);

    const resetView = () => {
        setIsScanning(false);
        setManualEntry(false);
        setScannedCode('');
    };

    return (
        <div>
            {/* Renderizar el div reader solo si isScanning es true */}
            {isScanning && <div id="reader"></div>}

            {isScanning && <p>Código escaneado: {scannedCode}</p>}

            {/* Mostrar botones iniciales solo si no se está escaneando ni ingresando manualmente */}
            {!isScanning && !manualEntry && (
                <>
                    <button onClick={() => setIsScanning(true)}>Iniciar escáner</button>
                    <button onClick={() => setManualEntry(true)}>Ingresar código</button>
                </>
            )}

            {/* Mostrar entrada manual y botón de envío si manualEntry es true */}
            {manualEntry && (
                <div>
                    <input 
                        type="text" 
                        value={scannedCode} 
                        onChange={(e) => setScannedCode(e.target.value)} 
                        placeholder="Ingrese el código manualmente"
                    />
                    <button onClick={() => {
                        sendToAPI(scannedCode);
                        setScannedCode('');
                        setManualEntry(false);
                    }}>
                        Enviar
                    </button>
                </div>
            )}

            {/* Mostrar botón de reinicio si se está escaneando o ingresando manualmente */}
            {(isScanning || manualEntry) && (
                <button onClick={resetView}>Volver</button>
            )}
        </div>
    );
}

export default ScannerComponent;