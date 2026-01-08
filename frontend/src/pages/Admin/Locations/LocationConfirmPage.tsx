import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocationDetail } from '../../../api/locations';
import { getEquipmentDetail, updateEquipment } from '../../../api/equipment';
import { ArrowLeft, MapPin, Box, CheckCircle, QrCode } from 'lucide-react';

const LOCATION_ZONES = ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'];
const LOCATION_CABINETS = Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']);
const LOCATION_NUMBERS = Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']);

export const LocationConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locationUuid = searchParams.get('location_uuid');
  
  const [equipmentId, setAddEquipmentId] = useState('');
  const [scannedEquipment, setScannedEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New state for detailed location
  const [zone, setZone] = useState('');
  const [cabinet, setCabinet] = useState('');
  const [number, setNumber] = useState('');

  const { data: location, isLoading: loadingLocation } = useQuery({
    queryKey: ['location', locationUuid],
    queryFn: () => getLocationDetail(locationUuid!),
    enabled: !!locationUuid,
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<any> }) => updateEquipment(uuid, data),
    onSuccess: () => {
      alert('設備位置已更新！');
      navigate('/');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
    onError: (err: any) => {
      setError('更新失敗：' + (err.response?.data?.detail || err.message));
    }
  });

  const handleVerifyEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setScannedEquipment(null);

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = equipmentId.match(uuidPattern);
    const uuid = match ? match[0] : equipmentId;

    if (!uuid) {
      setError('請輸入或掃描有效的設備 UUID');
      return;
    }

    try {
      const equipment = await getEquipmentDetail(uuid);
      setScannedEquipment(equipment);
      // Auto-fill existing details if any
      setZone(equipment.zone || '');
      setCabinet(equipment.cabinet || '');
      setNumber(equipment.number || '');
    } catch (err) {
      setError('找不到該設備，請確認 UUID 是否正確。');
    }
  };

  const handleConfirmPlacement = () => {
    if (!scannedEquipment || !locationUuid) return;

    updateMutation.mutate({
      uuid: scannedEquipment.uuid,
      data: { 
          location: locationUuid,
          target_location: null,
          zone: zone || '',
          cabinet: cabinet || '',
          number: number || '',
          status: 'AVAILABLE'
      }
    });
  };

  const handleSetAsTarget = () => {
    if (!scannedEquipment || !locationUuid) return;

    updateMutation.mutate({
      uuid: scannedEquipment.uuid,
      data: { 
          target_location: locationUuid,
          status: 'TO_BE_MOVED'
      }
    });
  };

  if (loadingLocation) return <div className="p-8 text-center">載入位置資訊...</div>;
  if (!locationUuid || !location) return <div className="p-8 text-center text-red-500">無效的位置資訊。</div>;

  const isTargetMatch = scannedEquipment?.target_location === locationUuid;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <button 
          onClick={() => navigate('/scan')} 
          className="flex items-center text-gray-600 mb-6 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> 返回掃描
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white text-center">
            <div className="inline-flex bg-blue-500/30 p-3 rounded-full mb-3">
              <MapPin className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold">確認存放位置</h1>
            <p className="text-blue-100 mt-1">{location.full_path}</p>
          </div>

          <div className="p-6 space-y-6">
            {!scannedEquipment ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500 mb-4 text-center">
                        請輸入或掃描欲存放在此位置的 <b>設備 QR Code</b>
                    </p>
                    
                    <form onSubmit={handleVerifyEquipment} className="space-y-4">
                        <div className="relative">
                            <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="掃描設備..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={equipmentId}
                                onChange={(e) => setAddEquipmentId(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" className="hidden">Verify</button>
                    </form>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className={`p-4 rounded-xl border-2 ${isTargetMatch ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-300'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <Box className={`w-6 h-6 ${isTargetMatch ? 'text-green-600' : 'text-orange-600'}`} />
                            <h2 className="font-bold text-lg">{scannedEquipment.name}</h2>
                        </div>
                        
                        {isTargetMatch ? (
                            <p className="text-green-700 text-sm flex items-center gap-1 font-medium">
                                <CheckCircle className="w-4 h-4" /> 此處為系統指定的目標位置
                            </p>
                        ) : (
                            <div className="text-orange-700 text-sm">
                                <p className="font-medium">⚠️ 注意：此處非指定的目標位置</p>
                                {scannedEquipment.target_location_details && (
                                    <p className="mt-1 opacity-80">
                                        系統建議目的地：{scannedEquipment.target_location_details.full_path}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">指定具體位置</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">區</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={zone}
                                    onChange={e => setZone(e.target.value)}
                                >
                                    <option value="">選擇</option>
                                    {LOCATION_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">櫃</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={cabinet}
                                    onChange={e => setCabinet(e.target.value)}
                                >
                                    <option value="">選擇</option>
                                    {LOCATION_CABINETS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">號</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                >
                                    <option value="">選擇</option>
                                    {LOCATION_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleConfirmPlacement}
                            disabled={updateMutation.isPending}
                            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                                isTargetMatch ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            <CheckCircle className="w-5 h-5" />
                            {updateMutation.isPending ? '提交中...' : '確認放置在此'}
                        </button>

                        {!isTargetMatch && (
                            <button
                                onClick={handleSetAsTarget}
                                disabled={updateMutation.isPending}
                                className="w-full py-3 rounded-xl font-bold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-5 h-5" />
                                設為目標目的地
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => { setScannedEquipment(null); setAddEquipmentId(''); }}
                        className="w-full text-gray-500 text-sm font-medium py-2 hover:text-gray-700"
                    >
                        取消並重新掃描
                    </button>
                </div>
            )}

            {!scannedEquipment && (
                <div className="text-center">
                    <button 
                        onClick={() => navigate('/scan')}
                        className="text-blue-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto hover:underline"
                    >
                        <QrCode className="w-4 h-4" /> 再次啟動相機掃描設備
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
