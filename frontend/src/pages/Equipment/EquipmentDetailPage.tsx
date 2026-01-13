import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentDetail, getEquipmentHistory, updateEquipment } from '../../api/equipment';
import { getLocations } from '../../api/locations';
import { transactionsApi } from '../../api/transactions';
import type { Equipment, Transaction } from '../../types';
import { 
    ArrowLeft, Box, Activity, User as UserIcon, 
    History, MapPin, Move, X, Save, 
    Camera, QrCode, CheckCircle, Truck, ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { EquipmentStatusBadge } from '../../components/Equipment/EquipmentStatusBadge';
import { LocationDisplay } from '../../components/Equipment/LocationDisplay';
import { QRCodeSVG } from 'qrcode.react';
import { QRCodeScannerModal } from '../../components/Scan/QRCodeScannerModal';
import { compressImage } from '../../utils/imageCompression';

const LOCATION_ZONES = ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'];
const LOCATION_CABINETS = Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']);
const LOCATION_NUMBERS = Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']);

export const EquipmentDetailPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const intent = searchParams.get('intent');
  const queryClient = useQueryClient();
  const { user: loggedInUser } = useAuthStore();
  
  // Modals visibility
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // States
  const [confirmType, setConfirmType] = useState<'START' | 'FINISH'>('START');
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [targetZone, setTargetZone] = useState('');
  const [targetCabinet, setTargetCabinet] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [targetLocationId, setTargetLocationId] = useState('');
  const [verifyLocationId, setVerifyLocationId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const clearIntent = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('intent');
    setSearchParams(newParams, { replace: true });
  };

  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ['equipment', uuid],
    queryFn: () => getEquipmentDetail(uuid!),
    enabled: !!uuid,
  });

  const { data: history } = useQuery({
    queryKey: ['equipment-history', uuid],
    queryFn: () => getEquipmentHistory(uuid!),
    enabled: !!uuid,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
    enabled: isMoveModalOpen,
  });

  // Auto-open modals based on intent once equipment is loaded
  useEffect(() => {
    if (!intent || !equipment) return;
    
    // Wrap in timeout to avoid synchronous setState during render/effect cycle
    const timer = setTimeout(() => {
      if (intent === 'borrow') setIsBorrowModalOpen(true);
      if (intent === 'dispatch') setIsDispatchModalOpen(true);
      if (intent === 'move') {
          setTargetLocationId(equipment.location || '');
          setIsMoveModalOpen(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [intent, equipment]);

  const moveMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<Equipment> | FormData }) => updateEquipment(uuid, data),
    onSuccess: () => {
      alert('操作成功！');
      setIsMoveModalOpen(false);
      setIsConfirmModalOpen(false);
      setSelectedFile(null);
      clearIntent();
      queryClient.invalidateQueries({ queryKey: ['equipment', uuid] });
      queryClient.invalidateQueries({ queryKey: ['equipment-history', uuid] });
    },
    onError: (err: Error) => {
      // @ts-expect-error - Custom axios error response
      const detail = (err as Record<string, unknown>).response?.data?.detail;
      alert('操作失敗：' + (detail || err.message));
    }
  });

  const borrowMutation = useMutation({
    mutationFn: transactionsApi.borrow,
    onSuccess: () => {
      alert('借用申請已提交！');
      setIsBorrowModalOpen(false);
      setSelectedFile(null);
      setReason('');
      clearIntent();
      queryClient.invalidateQueries({ queryKey: ['equipment', uuid] });
      queryClient.invalidateQueries({ queryKey: ['equipment-history', uuid] });
    },
    onError: (err: Error) => {
      // @ts-expect-error - Custom axios error response
      const detail = (err as Record<string, unknown>).response?.data?.detail;
      alert('借用失敗：' + (detail || err.message));
    }
  });

  const dispatchMutation = useMutation({
    mutationFn: transactionsApi.dispatch,
    onSuccess: () => {
      alert('出庫申請已提交！');
      setIsDispatchModalOpen(false);
      setSelectedFile(null);
      setReason('');
      clearIntent();
      queryClient.invalidateQueries({ queryKey: ['equipment', uuid] });
      queryClient.invalidateQueries({ queryKey: ['equipment-history', uuid] });
    },
    onError: (err: Error) => {
      // @ts-expect-error - Custom axios error response
      const detail = (err as Record<string, unknown>).response?.data?.detail;
      alert('出庫失敗：' + (detail || err.message));
    }
  });

  const returnMutation = useMutation({
    mutationFn: transactionsApi.returnRequest,
    onSuccess: () => {
      alert('歸還申請已提交！');
      queryClient.invalidateQueries({ queryKey: ['equipment', uuid] });
      queryClient.invalidateQueries({ queryKey: ['equipment-history', uuid] });
    },
    onError: (err: Error) => {
      // @ts-expect-error - Custom axios error response
      const detail = (err as Record<string, unknown>).response?.data?.detail;
      alert('歸還失敗：' + (detail || err.message));
    },
  });

  // Event Handlers
  const handleCloseBorrow = () => { setIsBorrowModalOpen(false); clearIntent(); setSelectedFile(null); };
  const handleCloseDispatch = () => { setIsDispatchModalOpen(false); clearIntent(); setSelectedFile(null); };
  const handleCloseMove = () => { setIsMoveModalOpen(false); clearIntent(); };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) return;
    const formData = new FormData();
    formData.append('equipment_uuid', uuid);
    if (dueDate) formData.append('due_date', new Date(dueDate).toISOString());
    formData.append('reason', reason);
    if (selectedFile) {
        setIsCompressing(true);
        try {
            const file = await compressImage(selectedFile);
            formData.append('image', file);
        } catch {
            formData.append('image', selectedFile);
        }
        setIsCompressing(false);
    }
    borrowMutation.mutate(formData);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) return;
    const formData = new FormData();
    formData.append('equipment_uuid', uuid);
    formData.append('reason', reason);
    if (selectedFile) {
        setIsCompressing(true);
        try {
            const file = await compressImage(selectedFile);
            formData.append('image', file);
        } catch {
            formData.append('image', selectedFile);
        }
        setIsCompressing(false);
    }
    dispatchMutation.mutate(formData);
  };

  const handleReturn = () => {
    if (window.confirm('確定要歸還此設備嗎？')) {
      if (uuid) returnMutation.mutate({ equipment_uuid: uuid });
    }
  };

  const handleMoveApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !equipment) return;
    const formData = new FormData();
    formData.append('target_location', targetLocationId || equipment.location || '');
    formData.append('target_zone', targetZone || '');
    formData.append('target_cabinet', targetCabinet || '');
    formData.append('target_number', targetNumber || '');
    formData.append('status', 'TO_BE_MOVED');
    moveMutation.mutate({ uuid, data: formData });
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !equipment) return;
    const formData = new FormData();
    if (confirmType === 'START') {
        formData.append('status', 'IN_TRANSIT');
    } else {
        if (equipment.target_location) formData.append('location', equipment.target_location);
        formData.append('zone', equipment.target_zone || '');
        formData.append('cabinet', equipment.target_cabinet || '');
        formData.append('number', equipment.target_number || '');
        formData.append('target_zone', '');
        formData.append('target_cabinet', '');
        formData.append('target_number', '');
        formData.append('status', 'AVAILABLE');
    }
    if (selectedFile) {
        setIsCompressing(true);
        try {
            const compressedFile = await compressImage(selectedFile);
            formData.append('transaction_image', compressedFile);
        } catch {
            formData.append('transaction_image', selectedFile);
        }
        setIsCompressing(false);
    }
    moveMutation.mutate({ uuid, data: formData });
  };

  const actionMap: Record<string, string> = {
    BORROW: '借用', RETURN: '歸還', MAINTENANCE_IN: '送修', MAINTENANCE_OUT: '修復',
    MOVE_START: '開始搬運', MOVE_CONFIRM: '搬運送達', DISPATCH: '出庫'
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold italic animate-pulse">載入設備詳情...</div>;
  if (isError || !equipment) return <div className="p-8 text-center text-red-500 font-black">找不到設備。</div>;

  const showReturnButton = equipment.status === 'BORROWED' && equipment.current_possession?.id === loggedInUser?.id;

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-primary px-6 py-4 flex items-center justify-between text-white sticky top-0 z-10 shadow-sm">
                <div className="flex items-center">
                    <button onClick={() => navigate('/', { replace: true })} className="mr-4 hover:bg-white/10 p-1 rounded transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold">設備詳情</h1>
                </div>
                <button onClick={() => setShowQR(true)} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm shadow-sm backdrop-blur-sm">
                    <QrCode className="h-4 w-4" /> <span>QR Code</span>
                </button>
            </div>

            <div className="p-6 space-y-6">
                {equipment.image && (
                    <div className="w-full h-64 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
                        <img src={equipment.image} alt={equipment.name} className="w-full h-full object-contain" />
                    </div>
                )}

                <div className="flex items-start space-x-4">
                    <div className="bg-blue-50 p-3 rounded-2xl"> <Box className="h-8 w-8 text-blue-600" /> </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">{equipment.name}</h2>
                        <p className="text-gray-500 mt-1 text-sm">{equipment.description || '暫無描述'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-2 text-gray-400 mb-1">
                            <Activity className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">目前狀態</span>
                        </div>
                        <EquipmentStatusBadge status={equipment.status} className={`text-sm px-3 py-1 ${equipment.status === 'IN_TRANSIT' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-2 text-gray-400 mb-1">
                            <UserIcon className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">持有者</span>
                        </div>
                        <div className={`font-bold ${equipment.current_possession?.username ? 'text-gray-800' : 'text-gray-300'}`}>
                            {equipment.current_possession?.username || '無'}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-gray-50 overflow-hidden">
                    <div className="p-4 bg-green-50/30">
                        <h3 className="text-xs font-bold text-green-600 mb-3 flex items-center gap-1 uppercase tracking-widest"> <MapPin className="w-4 h-4" /> 目前存放位置 </h3>
                        <div className="space-y-3">
                            {equipment.location_details?.full_path && (
                                <div className="text-green-800 font-bold bg-green-100/50 px-4 py-2 rounded-xl border border-green-200/50"> {equipment.location_details.full_path} </div>
                            )}
                            <div className="flex gap-2">
                                {equipment.zone || equipment.cabinet || equipment.number ? (
                                    <>
                                        {equipment.zone && <span className="bg-green-600 px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm">{equipment.zone}</span>}
                                        {equipment.cabinet && <span className="bg-green-600 px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm">{equipment.cabinet}</span>}
                                        {equipment.number && <span className="bg-green-600 px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm">{equipment.number}</span>}
                                    </>
                                ) : !equipment.location && <span className="text-gray-400 text-xs italic bg-gray-100/50 px-3 py-2 rounded-lg border border-dashed border-gray-200 w-full text-center">尚未指派位置</span>}
                            </div>
                        </div>
                    </div>

                    {(equipment.status === 'TO_BE_MOVED' || equipment.status === 'IN_TRANSIT' || equipment.target_location) && (
                        <div className="p-4 bg-orange-50/30 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-orange-600 mb-3 flex items-center gap-1 uppercase tracking-widest"> <Move className="w-4 h-4" /> 目的位置 (目標) </h3>
                            <div className="space-y-3">
                                {equipment.target_location_details?.full_path && (
                                    <div className="text-orange-800 font-bold bg-orange-100/50 px-4 py-2 rounded-xl border border-orange-200/50"> {equipment.target_location_details.full_path} </div>
                                )}
                                <div className="flex gap-2">
                                    {equipment.target_zone && <span className="bg-orange-600 px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm">{equipment.target_zone}</span>}
                                    {equipment.target_cabinet && <span className="bg-orange-600 px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm">{equipment.target_cabinet}</span>}
                                    {equipment.target_number && <span className="bg-orange-600 px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm">{equipment.target_number}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6 space-y-3 border-t border-gray-50">
                    {/* 僅保留特定情境下的動作按鈕，新申請統一由首頁掃描發起 */}
                    
                    {equipment.status === 'AVAILABLE' && (
                        <div className="space-y-3">
                            <button 
                                onClick={() => setIsBorrowModalOpen(true)} 
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                <ClipboardList className="w-5 h-5" /> 借用設備
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setTargetLocationId(equipment.location || ''); setIsMoveModalOpen(true); }} 
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Move className="w-4 h-4" /> 申請移動
                                </button>
                                <button 
                                    onClick={() => setIsDispatchModalOpen(true)} 
                                    className="flex-1 bg-orange-100 text-orange-700 py-4 rounded-xl font-bold hover:bg-orange-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Truck className="w-4 h-4" /> 申請出庫
                                </button>
                            </div>
                        </div>
                    )}

                    {equipment.status === 'TO_BE_MOVED' && (
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setIsMoveModalOpen(true)} className="flex-1 bg-gray-100 text-gray-600 px-4 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all whitespace-nowrap">修改計畫</button>
                            <button onClick={() => { setConfirmType('START'); setIsConfirmModalOpen(true); }} className="flex-[1.5] bg-orange-600 text-white px-4 py-4 rounded-xl font-black hover:bg-orange-700 shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"> <Move className="w-5 h-5" /> 開始搬運 </button>
                        </div>
                    )}

                    {equipment.status === 'IN_TRANSIT' && (
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setIsMoveModalOpen(true)} className="flex-1 bg-gray-100 text-gray-600 px-4 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all whitespace-nowrap">修改計畫</button>
                            <button onClick={() => { setConfirmType('FINISH'); setIsConfirmModalOpen(true); }} className="flex-[2] bg-green-600 text-white px-4 py-4 rounded-xl font-black hover:bg-green-700 shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"> <Save className="w-6 h-6" /> 確認送達 </button>
                        </div>
                    )}

                    {showReturnButton && (
                        <button 
                            onClick={handleReturn} 
                            disabled={returnMutation.isPending} 
                            className="w-full bg-amber-500 text-white py-4 rounded-xl font-black hover:bg-amber-600 shadow-lg shadow-amber-100 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {returnMutation.isPending ? '提交中...' : '歸還設備'}
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                <History className="h-5 w-5 text-gray-400" /> <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">歷史紀錄</h3>
            </div>
            <div className="divide-y divide-gray-50">
                {(history as unknown as Transaction[] | undefined)?.length ? (history as unknown as Transaction[]).map((txn) => (
                    <div key={txn.id} className="p-5 flex gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${txn.action === 'BORROW' ? 'bg-blue-500' : txn.action === 'RETURN' ? 'bg-green-500' : txn.action.startsWith('MOVE') ? 'bg-orange-500' : 'bg-gray-300'}`} />
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                                <span className="font-black text-gray-800 text-sm">{actionMap[txn.action] || txn.action}</span>
                                <span className="text-[10px] font-bold text-gray-400"> {new Date(txn.created_at).toLocaleString()} </span>
                            </div>
                            <div className="text-xs text-gray-500 font-bold">操作者: <span className="text-gray-700">{txn.user_detail?.username || '未知'}</span></div>
                            {(txn.location_details || txn.zone || txn.cabinet || txn.number) && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"> <MapPin className="w-3 h-3" /> 交易時位置 </div>
                                    <LocationDisplay location={txn.location_details} zone={txn.zone} cabinet={txn.cabinet} number={txn.number} placeholder="未知位置" />
                                </div>
                            )}
                            {txn.image && (
                                <div className="mt-3">
                                    <a href={txn.image} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                                        <img src={txn.image} alt="Action Record" className="h-24 w-auto object-cover rounded-xl border border-gray-200 shadow-sm" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl"> <Camera className="w-6 h-6 text-white" /> </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )) : <div className="p-10 text-center text-gray-400 text-xs font-bold italic">暫無歷史紀錄</div>}
            </div>
        </div>
      </div>

      {/* Modals */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-gray-800">申請移動設備</h3>
                    <button onClick={handleCloseMove} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleMoveApply} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">指定預計移入目的地</h4>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">目標倉庫</label>
                            <select className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-orange-500 outline-none bg-white transition-colors" value={targetLocationId} onChange={e => setTargetLocationId(e.target.value)} required>
                                <option value="">選擇倉庫...</option>
                                {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[['區', targetZone, setTargetZone, LOCATION_ZONES], ['櫃', targetCabinet, setTargetCabinet, LOCATION_CABINETS], ['號', targetNumber, setTargetNumber, LOCATION_NUMBERS]].map(([label, val, set, opts]) => (
                                <div key={label as string}>
                                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">{label as string}</label>
                                    <select className="w-full border-2 border-gray-100 rounded-xl px-2 py-2.5 text-sm font-bold focus:border-orange-500 outline-none bg-white transition-colors" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}>
                                        <option value="">選擇</option>
                                        {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={handleCloseMove} className="flex-1 py-3 border-2 border-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-100">取消</button>
                        <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg" disabled={moveMutation.isPending}>確認提交</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isBorrowModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-blue-50/50">
                    <h3 className="text-xl font-black text-gray-800">借用設備申請</h3>
                    <button onClick={handleCloseBorrow} className="bg-white p-2 rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">預計歸還日期</label>
                        <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">借用原因</label>
                        <textarea className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm h-24 resize-none" placeholder="請輸入借用原因..." value={reason} onChange={e => setReason(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">拍照記錄 (選填)</label>
                        <input type="file" accept="image/*" capture="environment" className="text-xs" onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg" disabled={borrowMutation.isPending || isCompressing}>
                        {isCompressing ? '壓縮中...' : (borrowMutation.isPending ? '提交中...' : '確認提交申請')}
                    </button>
                </form>
            </div>
        </div>
      )}

      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-orange-50/50">
                    <h3 className="text-xl font-black text-gray-800">設備出庫申請</h3>
                    <button onClick={handleCloseDispatch} className="bg-white p-2 rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleDispatchSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">出庫原因/目的地</label>
                        <textarea className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm h-24 resize-none" placeholder="例如：出貨給客戶、報廢、寄往分公司..." value={reason} onChange={e => setReason(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">拍照記錄 (選填)</label>
                        <input type="file" accept="image/*" capture="environment" className="text-xs" onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                    </div>
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-black hover:bg-orange-700 shadow-lg" disabled={dispatchMutation.isPending || isCompressing}>
                        {isCompressing ? '壓縮中...' : (dispatchMutation.isPending ? '提交中...' : '確認提交出庫申請')}
                    </button>
                </form>
            </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`px-6 py-5 border-b border-gray-50 flex justify-between items-center ${confirmType === 'START' ? 'bg-orange-50/50' : 'bg-green-50/50'}`}>
                    <h3 className="text-xl font-black text-gray-800">{confirmType === 'START' ? '開始搬運' : '搬運送達'}</h3>
                    <button onClick={() => { setIsConfirmModalOpen(false); setSelectedFile(null); }} className="bg-white/80 p-2 rounded-full text-gray-400 hover:text-gray-600 shadow-sm"> <X className="h-5 w-5" /> </button>
                </div>
                <form onSubmit={handleConfirmAction} className="p-6 space-y-6">
                    {confirmType === 'START' ? (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <label className="block text-[10px] font-black text-blue-600 mb-2 uppercase tracking-widest"> 請掃描「設備」QR Code </label>
                            <button type="button" onClick={() => setIsScannerOpen(true)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"> <Camera className="w-4 h-4" /> 啟動相機掃描 </button>
                            {verifyLocationId && <div className="mt-3 p-2 bg-white rounded-xl border border-blue-100 text-center">
                                <p className="text-[10px] text-gray-400 mb-1">掃描結果</p>
                                <p className="font-mono text-xs text-gray-800 break-all mb-2">{verifyLocationId}</p>
                                {verifyLocationId.includes(equipment.uuid) ? <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100"> 設備驗證成功 </span> : <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100"> 設備不符 </span>}
                            </div>}
                        </div>
                    ) : (
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <label className="block text-[10px] font-black text-green-600 mb-2 uppercase tracking-widest"> 請掃描「目標位置」QR Code </label>
                            <button type="button" onClick={() => setIsScannerOpen(true)} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"> <Camera className="w-4 h-4" /> 啟動相機掃描 </button>
                            {verifyLocationId && <div className="mt-3 p-2 bg-white rounded-xl border border-green-100 text-center">
                                <p className="text-[10px] text-gray-400 mb-1">掃描結果</p>
                                <p className="font-mono text-xs text-gray-800 break-all mb-2">{verifyLocationId}</p>
                                {verifyLocationId.includes(equipment.target_location || '') ? <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100"> 位置驗證成功 </span> : <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100"> 位置不符 </span>}
                            </div>}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">拍照記錄狀態</label>
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-200 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all relative overflow-hidden bg-gray-50/50 group">
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                            {selectedFile ? <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-contain" /> : <><div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8 text-gray-400" /></div><span className="text-sm font-bold text-gray-500">開啟相機拍照</span></>}
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => { setIsConfirmModalOpen(false); setSelectedFile(null); setVerifyLocationId(''); }} className="flex-1 py-3 border-2 border-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-50">取消</button>
                        <button type="submit" className={`flex-[2] py-3 rounded-xl text-white font-black transition-all shadow-lg ${confirmType === 'START' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'}`} disabled={moveMutation.isPending || (confirmType === 'START' && !verifyLocationId.includes(equipment.uuid)) || (confirmType === 'FINISH' && !verifyLocationId.includes(equipment.target_location || ''))}> {moveMutation.isPending ? '處理中...' : (confirmType === 'START' ? '確認並開始搬運' : '確認已送達')} </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <QRCodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(text) => { setVerifyLocationId(text); setIsScannerOpen(false); }} title={confirmType === 'START' ? '掃描設備標籤' : '掃描位置標籤'} instructions={confirmType === 'START' ? '請對準設備上的 QR Code' : '請對準目的地的位置 QR Code'} />
      {showQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800">設備 QR Code</h2>
            <div className="bg-white p-4 border-2 border-gray-100 inline-block mb-4 rounded-xl shadow-inner">
              <QRCodeSVG value={window.location.href} size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">{equipment.name}</p>
            <p className="text-xs text-gray-500 mb-6 font-mono">{equipment.uuid}</p>
            <button onClick={() => setShowQR(false)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"> 關閉 </button>
          </div>
        </div>
      )}
    </div>
  );
};