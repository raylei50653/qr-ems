import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../../../api/locations';
import { getEquipmentList, updateEquipment } from '../../../api/equipment';
import { getCategories } from '../../../api/categories';
import type { Equipment, Location } from '../../../types';
import { ArrowLeft, Warehouse, MapPin, Plus, Edit, Trash2, X, Save, Search, ChevronRight, ChevronDown, QrCode } from 'lucide-react';import { useNavigate } from 'react-router-dom';
import { EquipmentStatusBadge } from '../../../components/Equipment/EquipmentStatusBadge';
import { LocationDisplay } from '../../../components/Equipment/LocationDisplay';
import { QRCodeSVG } from 'qrcode.react';

const LOCATION_ZONES = ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'];
const LOCATION_CABINETS = Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']);
const LOCATION_NUMBERS = Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']);

export const LocationManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Inventory State
  const [invPage, setInvPage] = useState(1);
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvSearchCategory] = useState('');
  const [invLocation, setInvLocation] = useState('');
  const [invZone, setInvZone] = useState('');
  const [invCabinet, setInvCabinet] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Modals State
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Partial<Location> | null>(null);
  const [movingItem, setMovingItem] = useState<Equipment | null>(null);
  const [isTargetMode, setIsTargetMode] = useState(false);
  const [moveData, setMoveData] = useState({ location: '', zone: '', cabinet: '', number: '' });

  // Queries
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const { data: inventory, isLoading: loadingInv } = useQuery({
    queryKey: ['equipment-inventory', invPage, invSearch, invCategory, invLocation, invZone, invCabinet, invNumber],
    queryFn: () => getEquipmentList(invPage, invSearch, invCategory, '', invLocation, invZone, invCabinet, invNumber),
  });

  // Mutations
  const locMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid?: string; data: any }) => 
        uuid ? updateLocation(uuid, data) : createLocation(data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['locations'] });
        setIsLocModalOpen(false);
        setEditingLoc(null);
    }
  });

  const deleteLocMutation = useMutation({
    mutationFn: (uuid: string) => deleteLocation(uuid),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['locations'] });
        setInvLocation(''); // Reset selected location after delete
        alert('倉庫位置已成功刪除');
    },
    onError: (err: any) => {
        alert('刪除失敗：' + (err.response?.data?.detail || '請確認此位置是否仍有子位置或關聯設備'));
    }
  });

  const handleDeleteLocation = () => {
      if (!invLocation) return;
      const loc = locations?.find(l => l.uuid === invLocation);
      if (window.confirm(`確定要刪除「${loc?.name}」嗎？此操作不可復原，且必須確保此倉庫內無任何設備。`)) {
          deleteLocMutation.mutate(invLocation);
      }
  };

  const equipmentMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: any }) => updateEquipment(uuid, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['equipment-inventory'] });
        setMovingItem(null);
        alert('位置資訊已更新');
    }
  });

  const handleOpenMove = (item: Equipment, targetMode: boolean) => {
      setMovingItem(item);
      setIsTargetMode(targetMode);
      const locId = targetMode ? (item.target_location || item.location || '') : (item.location || '');
      setMoveData({
          location: locId,
          zone: targetMode ? (item.target_zone || '') : (item.zone || ''),
          cabinet: targetMode ? (item.target_cabinet || '') : (item.cabinet || ''),
          number: targetMode ? (item.target_number || '') : (item.number || ''),
      });
  };

  const handleMoveAction = (isTarget: boolean) => {
      if (!movingItem) return;
      const payload: any = isTarget ? {
          target_location: moveData.location || null,
          target_zone: moveData.zone,
          target_cabinet: moveData.cabinet,
          target_number: moveData.number,
          status: 'TO_BE_MOVED'
      } : {
          location: moveData.location || null,
          zone: moveData.zone,
          cabinet: moveData.cabinet,
          number: moveData.number,
          target_location: null,
          target_zone: '',
          target_cabinet: '',
          target_number: '',
          status: 'AVAILABLE'
      };
      equipmentMutation.mutate({ uuid: movingItem.uuid, data: payload });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center">
            <button onClick={() => navigate('/')} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Warehouse className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-xl font-black tracking-tight">儲存位置盤點</h1>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/admin/locations/qrcode')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
                <QrCode className="w-4 h-4" /> 生成標籤
            </button>
            <button 
                onClick={() => { setEditingLoc({}); setIsLocModalOpen(true); }}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
                <Plus className="w-4 h-4" /> 新增倉庫
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 overflow-y-auto">
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder="搜尋設備名稱或描述..." 
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                        value={invSearch}
                        onChange={e => { setInvSearch(e.target.value); setInvPage(1); }}
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <div className="flex gap-2 flex-1 md:flex-initial">
                        <select 
                            className="flex-1 md:w-48 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none"
                            value={invLocation}
                            onChange={e => { setInvLocation(e.target.value); setInvPage(1); }}
                        >
                            <option value="">所有倉庫位置</option>
                            {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                        </select>
                        <button 
                            onClick={() => setIsQRModalOpen(true)}
                            disabled={!invLocation}
                            className={`p-2 rounded-xl transition-colors shrink-0 ${invLocation ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-gray-100 text-gray-300'}`}
                            title={invLocation ? "顯示位置 QR Code" : "請先選擇位置"}
                        >
                            <QrCode className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => {
                                const loc = locations?.find(l => l.uuid === invLocation);
                                if (loc) {
                                    setEditingLoc(loc);
                                    setIsLocModalOpen(true);
                                }
                            }}
                            disabled={!invLocation}
                            className={`p-2 rounded-xl transition-colors shrink-0 ${invLocation ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-300'}`}
                            title={invLocation ? "編輯此位置名稱/層級" : "請先選擇位置"}
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleDeleteLocation}
                            disabled={!invLocation}
                            className={`p-2 rounded-xl transition-colors shrink-0 ${invLocation ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-300'}`}
                            title={invLocation ? "刪除此倉庫位置" : "請先選擇位置"}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <select 
                            className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none w-20"
                            value={invZone}
                            onChange={e => { setInvZone(e.target.value); setInvPage(1); }}
                        >
                            <option value="">區</option>
                            {LOCATION_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <select 
                            className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none w-20"
                            value={invCabinet}
                            onChange={e => { setInvCabinet(e.target.value); setInvPage(1); }}
                        >
                            <option value="">櫃</option>
                            {LOCATION_CABINETS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                            className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none w-20"
                            value={invNumber}
                            onChange={e => { setInvNumber(e.target.value); setInvPage(1); }}
                        >
                            <option value="">號</option>
                            {LOCATION_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <select 
                        className="flex-1 md:w-40 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                        value={invCategory}
                        onChange={e => { setInvSearchCategory(e.target.value); setInvPage(1); }}
                    >
                        <option value="">所有類別</option>
                        {categories?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Equipment Table */}
            <div className="bg-white shadow rounded-3xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-black text-gray-700 uppercase tracking-widest">
                                <th className="px-6 py-4 text-left">名稱 / 描述</th>
                                <th className="px-6 py-4 text-left">類別</th>
                                <th className="px-6 py-4 text-left">狀態</th>
                                <th className="px-6 py-4 text-left">目前位置</th>
                                <th className="px-6 py-4 text-left">目標目的地</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loadingInv ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic font-bold">載入中...</td></tr>
                            ) : inventory?.results.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold">此位置暫無設備</td></tr>
                            ) : inventory?.results.map((item: Equipment) => (
                                <tr key={item.uuid} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-2.5 text-gray-300" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-900 truncate flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => window.open(`/equipment/${item.uuid}`, '_blank')}>
                                                    {item.name}
                                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.description || '無描述'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{item.category_details?.name || '未分類'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <EquipmentStatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer hover:bg-green-50/50 group/cell" onClick={() => handleOpenMove(item, false)}>
                                        <div className="flex justify-between items-start gap-2">
                                            <LocationDisplay location={item.location_details} zone={item.zone} cabinet={item.cabinet} number={item.number} />
                                            <Edit className="w-3.5 h-3.5 text-slate-500 group-hover/cell:text-slate-900 transition-colors mt-0.5" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer hover:bg-orange-50/50 group/cell" onClick={() => handleOpenMove(item, true)}>
                                        <div className="flex justify-between items-start gap-2">
                                            <LocationDisplay isTarget location={item.target_location_details} zone={item.target_zone} cabinet={item.target_cabinet} number={item.target_number} placeholder="點擊設定目標" />
                                            <Edit className="w-3.5 h-3.5 text-slate-500 group-hover/cell:text-slate-900 transition-colors mt-0.5" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {inventory && inventory.count > 10 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={!inventory.previous} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">上一頁</button>
                            <button onClick={() => setInvPage(p => p + 1)} disabled={!inventory.next} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">下一頁</button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <p className="text-xs font-bold text-gray-500">顯示第 <span className="text-gray-800">{((invPage - 1) * 10) + 1}</span> 到 <span className="text-gray-800">{Math.min(invPage * 10, inventory.count)}</span> 筆，共 <span className="text-gray-800">{inventory.count}</span> 筆</p>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={!inventory.previous} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-bold text-gray-700">頁次 {invPage} / {Math.ceil(inventory.count / 10) || 1}</span>
                                <button onClick={() => setInvPage(p => p + 1)} disabled={!inventory.next} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Move Modal */}
      {movingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 leading-tight">{isTargetMode ? '設定轉移目標' : '修正目前位置'}</h3>
                        <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">設備: {movingItem.name}</p>
                    </div>
                    <button onClick={() => setMovingItem(null)} className="bg-white p-2 rounded-2xl text-gray-400 hover:text-gray-600 shadow-sm transition-all"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="block text-xs font-black text-gray-600 uppercase tracking-widest px-1">具體格位資訊</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[['區', 'zone'], ['櫃', 'cabinet'], ['號', 'number']].map(([label, field]) => (
                                    <div key={field}>
                                        <select 
                                            className={`w-full bg-white border-2 border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-black focus:border-primary outline-none shadow-sm transition-all ${isTargetMode ? 'focus:border-orange-500' : 'focus:border-green-600'}`}
                                            value={(moveData as any)[field]}
                                            onChange={e => setMoveData({...moveData, [field]: e.target.value})}
                                        >
                                            <option value="">{label}</option>
                                            {(field === 'zone' ? LOCATION_ZONES : field === 'cabinet' ? LOCATION_CABINETS : LOCATION_NUMBERS).map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <button onClick={() => handleMoveAction(isTargetMode)} className={`w-full py-4 rounded-[1.25rem] text-white font-black shadow-xl transition-all ${isTargetMode ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'}`}>
                            {equipmentMutation.isPending ? '處理中...' : isTargetMode ? '確認設定轉移目標' : '確認修正位置'}
                        </button>
                        <button onClick={() => setMovingItem(null)} className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm underline underline-offset-4">取消返回</button>
                    </div>
                </div>
            </div>
        </div>
      )}
      {/* Location QR Code Modal */}
      {isQRModalOpen && invLocation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in zoom-in-95 duration-200 text-center">
                  <h3 className="text-xl font-black text-gray-800 mb-2">位置 QR Code</h3>
                  <p className="text-xs text-gray-400 font-bold mb-6">掃描此碼可快速將設備歸還至此位置</p>
                  
                  <div className="bg-white p-4 border-2 border-gray-100 inline-block mb-6 rounded-2xl shadow-inner">
                      <QRCodeSVG 
                          value={`location:${invLocation}`} 
                          size={200}
                          level="H"
                          includeMargin={true}
                      />
                  </div>
                  
                  <div className="mb-6">
                      <p className="text-sm font-black text-gray-800">
                          {locations?.find(l => l.uuid === invLocation)?.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">
                          {locations?.find(l => l.uuid === invLocation)?.full_path}
                      </p>
                  </div>

                  <button 
                      onClick={() => setIsQRModalOpen(false)} 
                      className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg"
                  >
                      關閉
                  </button>
              </div>
          </div>
      )}

      {/* Location Modal */}
      {isLocModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in slide-in-from-bottom-4 duration-200">
                  <h3 className="text-xl font-black text-gray-800 mb-6">{editingLoc?.uuid ? '編輯儲存位置' : '新增儲存位置'}</h3>
                  <form onSubmit={(e) => { e.preventDefault(); locMutation.mutate({ uuid: editingLoc?.uuid, data: editingLoc }); }} className="space-y-5">
                      <div>
                          <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">位置名稱 (如: A棟-1F)</label>
                          <input 
                            type="text" required
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            value={editingLoc?.name || ''} onChange={e => setEditingLoc({...editingLoc, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">父級位置 (選填)</label>
                          <select 
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            value={editingLoc?.parent || ''} onChange={e => setEditingLoc({...editingLoc, parent: e.target.value})}
                          >
                              <option value="">無 (設為最上層)</option>
                              {locations?.filter(l => l.uuid !== editingLoc?.uuid).map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                          </select>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setIsLocModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all">取消</button>
                          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                              <Save className="w-4 h-4" /> 儲存變更
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
