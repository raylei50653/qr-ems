import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface QRCodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    title?: string;
    instructions?: string;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ 
    isOpen, 
    onClose, 
    onScanSuccess, 
    title = '掃描 QR Code', 
    instructions = '請將方框對準 QR Code' 
}) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const regionId = 'reader-modal-region';

    const stopScanner = React.useCallback(async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.warn("Error stopping scanner:", err);
            }
        }
    }, []);

    const startScanner = React.useCallback(async () => {
        setError(null);
        try {
            // Give the DOM a moment to render the div
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const formatsToSupport = [ Html5QrcodeSupportedFormats.QR_CODE ];
            const html5QrCode = new Html5Qrcode(regionId, { formatsToSupport, verbose: false });
            scannerRef.current = html5QrCode;

            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" }, 
                config, 
                (decodedText) => {
                    onScanSuccess(decodedText);
                    // Don't auto stop here, let parent handle close which stops it
                },
                () => {
                    // ignore errors
                }
            );
        } catch (err) {
            console.error("Error starting scanner:", err);
            setError("無法啟動相機，請確認權限設定。");
        }
    }, [onScanSuccess]);

    useEffect(() => {
        if (isOpen) {
            startScanner();
        } else {
            stopScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen, startScanner, stopScanner]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-4 bg-black flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
                    <div id={regionId} className="w-full h-full rounded-xl overflow-hidden bg-gray-900"></div>
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 text-center bg-white border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-bold">{instructions}</p>
                </div>
            </div>
        </div>
    );
};
