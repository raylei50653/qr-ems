import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, QrCode, Camera, X, Image as ImageIcon } from 'lucide-react';

export const ScanPage = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Ref to track scanning state synchronously for cleanup
  const isScanningRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "html5qr-code-full-region";

  // Sync ref with state
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    // Cleanup on unmount only
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop()
          .then(() => {
             // Only clear after stop is finished
             if (scannerRef.current) {
                return scannerRef.current.clear();
             }
          })
          .catch(err => {
             // Ignore errors if it was already stopped or other race conditions
             console.warn("Cleanup warning:", err);
          });
      }
    };
  }, []);

  const extractUuid = (text: string): string | null => {
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = text.match(uuidPattern);
    return match ? match[0] : null;
  };

  const handleScanSuccess = (decodedText: string) => {
    const uuid = extractUuid(decodedText);
    if (uuid) {
      stopScanning();
      navigate(`/equipment/${uuid}`);
    } else {
      console.warn("Scanned text does not contain a valid UUID:", decodedText);
    }
  };

  const startScanning = async () => {
    setError(null);
    try {
      const formatsToSupport = [ Html5QrcodeSupportedFormats.QR_CODE ];
      const html5QrCode = new Html5Qrcode(scannerRegionId, { formatsToSupport, verbose: false });
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        handleScanSuccess,
        (errorMessage) => {
          // ignore parsing errors
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("無法啟動相機，請確認您已允許相機權限。");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uuid = extractUuid(manualId);
    if (uuid) {
      navigate(`/equipment/${uuid}`);
    } else {
      setError('請輸入有效的設備 ID (UUID format)');
    }
  };

  // Handle file scan
  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const imageFile = e.target.files[0];
        // Create a temporary instance just for file scanning if main scanner is not active
        const html5QrCode = scannerRef.current || new Html5Qrcode(scannerRegionId);
        
        html5QrCode.scanFile(imageFile, true)
        .then(decodedText => {
            handleScanSuccess(decodedText);
        })
        .catch(err => {
            setError(`無法識別圖片中的 QR Code: ${err}`);
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
         <button onClick={() => navigate(-1)} className="mr-4 p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
         </button>
         <h1 className="text-lg font-bold text-gray-800">掃描設備 QR Code</h1>
      </div>

      <div className="flex-1 flex flex-col items-center p-4 max-w-md mx-auto w-full space-y-6">
        
        {/* Scanner Section */}
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 text-gray-700 font-medium">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>相機掃描</span>
             </div>
             {isScanning && (
                 <button onClick={stopScanning} className="text-sm text-red-500 flex items-center gap-1 hover:text-red-700">
                     <X className="w-4 h-4" /> 停止
                 </button>
             )}
          </div>
          
          <div className="relative overflow-hidden rounded-lg bg-gray-100 min-h-[300px] flex items-center justify-center">
              <div id={scannerRegionId} className="w-full h-full"></div>
              
              {!isScanning && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                     <button 
                        onClick={startScanning}
                        className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                     >
                        <Camera className="w-5 h-5" />
                        開啟相機掃描
                     </button>
                     <p className="mt-4 text-gray-400 text-sm">點擊按鈕以請求相機權限</p>
                 </div>
              )}
          </div>
          
          {!isScanning && (
            <div className="mt-4 flex justify-center">
                 <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                    <span>或掃描圖片檔</span>
                    <input type="file" accept="image/*" onChange={handleFileScan} className="hidden" />
                 </label>
            </div>
          )}

          {isScanning && (
              <p className="mt-3 text-center text-gray-500 text-sm">
                請將方框對準設備上的 QR Code
              </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center w-full">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-3 text-gray-400 text-sm">或</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Manual Input Section */}
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
            <Search className="w-5 h-5 text-blue-600" />
            <span>手動輸入 ID</span>
          </div>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                value={manualId}
                onChange={(e) => {
                  setManualId(e.target.value);
                  setError(null);
                }}
                placeholder="輸入設備 UUID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              前往設備頁面
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
