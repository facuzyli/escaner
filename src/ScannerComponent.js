import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import emailjs from 'emailjs-com';
import { storeEmail, retryPendingEmails } from './RetryEmails';

export const sendEmail = (code, localNumber, store) => {
    const templateParams = {
        code: code,
        localNumber: localNumber,
        store: store,
    };

    emailjs.send('service_159lgyl', 'template_qouw3so', templateParams, 'cataYOEwOQrXCUnMT')
        .then((response) => {
            alert(`La entrega fue notificada. Código de barras: ${code}`);
        }, (error) => {
            alert('Error al enviar el correo. Se intentará enviar más tarde.');
            storeEmail(code, localNumber , store);
        });
};

function ScannerComponent() {
    const [scannedCode, setScannedCode] = useState('');
    const [localNumber, setLocalNumber] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [manualEntry, setManualEntry] = useState(false);
    const [selectedStore, setSelectedStore] = useState('');
    let scanner;

    const localNumberRef = useRef(localNumber);

    useEffect(() => {
        localNumberRef.current = localNumber;
    }, [localNumber]);

    const onScanSuccess = (decodedText) => {
        const userConfirmation = window.confirm(`Tu código es el: ${decodedText}. ¿Deseas enviar el correo?`);
        if (userConfirmation) {
            sendEmail(decodedText, localNumberRef.current, selectedStore);
            setScannedCode('');
        } else {
            setScannedCode('');
            setIsScanning(true);
        }
    };

    const onScanError = (error) => {
        console.error(`Error during scanning: ${error}`);
    };

    const startScanning = () => {
        if (localNumber && Number.isInteger(Number(localNumber)) && selectedStore) {
            setIsScanning(true);
        } else {
            alert('Por favor, ingrese un número de local válido.');
        }
    };

    const startManualEntry = () => {
        if (localNumber && Number.isInteger(Number(localNumber)) && selectedStore) {
            setManualEntry(true);
        } else {
            alert('Por favor, ingrese un local válido.');
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
                <label>Tienda: </label>
                <select
                    value={selectedStore}
                    onChange={(e) => {
                        //console.log("Store selected:", e.target.value); 
                        setSelectedStore(e.target.value);
                    }}
                
                >
                    <option value="">Seleccione una tienda</option>
                    <option value="Macowens">Macowens</option>
                    <option value="Devre">Devre</option>
                </select>
            </div>
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
            {!isScanning && !manualEntry && <button onClick={startScanning}>Iniciar escáner</button>}
            {!isScanning && !manualEntry && <button onClick={startManualEntry}>Ingresar código</button>}
            {manualEntry && (
                <div>
                    <input 
                        type="text" 
                        value={scannedCode} 
                        onChange={(e) => setScannedCode(e.target.value)} 
                        placeholder="Ingrese el código manualmente"
                    />
                    <button onClick={() => {
                        sendEmail(scannedCode, localNumber, selectedStore);
                        setScannedCode('');
                        setManualEntry(false);
                    }}>
                        Enviar
                    </button>
                </div>
            )}
            {scannedCode && <button onClick={() => {
                setScannedCode('');
                setIsScanning(false);
            }}>Reiniciar escáner</button>}
        </div>
    );
}

export default ScannerComponent;