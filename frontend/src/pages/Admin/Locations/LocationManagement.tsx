import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../../../api/locations';
import { getEquipmentList, updateEquipment } from '../../../api/equipment';
import { getCategories } from '../../../api/categories';
import type { Location, Equipment } from '../../../types';
import { 
    Box, Plus, Search, X, ArrowLeft, Warehouse, 
    ArrowRightLeft, ChevronLeft, ChevronRight, 
    MapPin, Edit, Trash2, List, Grid3X3, Save, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../../api/client';
import { EquipmentStatusBadge } from '../../../components/Equipment/EquipmentStatusBadge';
import { LocationDisplay } from '../../../components/Equipment/LocationDisplay';

const LOCATION_ZONES = ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'];
const LOCATION_CABINETS = Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']);
const LOCATION_NUMBERS = Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']);



export const LocationManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Tabs: 'INVENTORY' (Equipment focus) or 'STRUCTURE' (Location focus)
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'STRUCTURE'>('INVENTORY');

  // Inventory State
  const [invPage, setInvPage] = useState(1);
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvSearchCategory] = useState('');
  const [invLocation, setInvLocation] = useState('');
  
  // Location Structure State
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Partial<Location> | null>(null);

  // Equipment Movement State
  const [movingItem, setMovingItem] = useState<Equipment | null>(null);
  const [isTargetMode, setIsTargetMode] = useState(false);
  const [moveData, setMoveData] = useState({
      location: '',
      zone: '',
      cabinet: '',
      number: ''
  });

  // Queries
  const { data: locations, isLoading: loadingLocs } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const { data: inventory, isLoading: loadingInv } = useQuery({
    queryKey: ['equipment-inventory', invPage, invSearch, invCategory, invLocation],
    queryFn: () => getEquipmentList(invPage, invSearch, invCategory, '', invLocation),
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
    mutationFn: deleteLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] })
  });

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
      if (targetMode) {
          setMoveData({
              location: item.target_location || item.location || '',
              zone: item.target_zone || '',
              cabinet: item.target_cabinet || '',
              number: item.target_number || '',
          });
      } else {
          setMoveData({
              location: item.location || '',
              zone: item.zone || '',
              cabinet: item.cabinet || '',
              number: item.number || '',
          });
      }
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4 text-gray-400 hover:text-primary transition-colors">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-black flex items-center text-gray-800 tracking-tight">
                <Warehouse className="mr-2 h-6 w-6 text-primary" />
                儲存位置管理
            </h1>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
            <button 
                onClick={() => setActiveTab('INVENTORY')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-black transition-all ${activeTab === 'INVENTORY' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Grid3X3 className="w-4 h-4" /> 位置盤點
            </button>
            <button 
                onClick={() => setActiveTab('STRUCTURE')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-black transition-all ${activeTab === 'STRUCTURE' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <List className="w-4 h-4" /> 倉庫管理
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {activeTab === 'INVENTORY' ? (
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
                    <div className="flex gap-2 w-full md:w-auto">
                        <select 
                            className="flex-1 md:w-48 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none"
                            value={invLocation}
                            onChange={e => { setInvLocation(e.target.value); setInvPage(1); }}
                        >
                            <option value="">所有倉庫位置</option>
                            {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                        </select>
                        <select 
                            className="flex-1 md:w-40 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none"
                            value={invCategory}
                            onChange={e => { setInvSearchCategory(e.target.value); setInvPage(1); }}
                        >
                            <option value="">所有類別</option>
                            {categories?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Equipment Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">名稱 / 描述</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">類別</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">狀態</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">目前位置</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">目標目的地</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingInv ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic font-bold">載入中...</td></tr>
                                ) : inventory?.results.map((item: Equipment) => (
                                    <tr key={item.uuid} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 shadow-inner">
                                                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-2.5 text-gray-300" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black text-gray-800 truncate flex items-center gap-1">
                                                        {item.name}
                                                        <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => window.open(`/equipment/${item.uuid}`, '_blank')} />
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{item.description || '無描述'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">
                                                {item.category_details?.name || '未分類'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <EquipmentStatusBadge status={item.status} />
                                        </td>
                                        <td 
                                            className="px-6 py-4 cursor-pointer hover:bg-green-50/50 transition-colors group/cell"
                                            onClick={() => handleOpenMove(item, false)}
                                            title="點擊修改目前位置"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <LocationDisplay 
                                                    location={item.location_details}
                                                    zone={item.zone}
                                                    cabinet={item.cabinet}
                                                    number={item.number}
                                                />
                                                <Edit className="w-3.5 h-3.5 text-slate-500 group-hover/cell:text-slate-900 transition-colors mt-0.5 flex-shrink-0" />
                                            </div>
                                        </td>
                                        <td 
                                            className="px-6 py-4 cursor-pointer hover:bg-orange-50/50 transition-colors group/cell"
                                            onClick={() => handleOpenMove(item, true)}
                                            title="點擊修改目標目的地"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <LocationDisplay 
                                                    isTarget
                                                    location={item.target_location_details}
                                                    zone={item.target_zone}
                                                    cabinet={item.target_cabinet}
                                                    number={item.target_number}
                                                    placeholder="無目的地 (點擊設定)"
                                                />
                                                <Edit className="w-3.5 h-3.5 text-slate-500 group-hover/cell:text-slate-900 transition-colors mt-0.5 flex-shrink-0" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {inventory && inventory.count > 10 && (
                        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <p className="text-[10px] font-black text-gray-400 uppercase">
                                顯示 {((invPage - 1) * 10) + 1} - {Math.min(invPage * 10, inventory.count)} 筆，共 {inventory.count} 筆
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setInvPage(p => p - 1)} disabled={!inventory.previous} className="p-2 bg-white border border-gray-200 rounded-lg disabled:opacity-30 shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="flex items-center px-4 text-xs font-black text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm">{invPage}</span>
                                <button onClick={() => setInvPage(p => p + 1)} disabled={!inventory.next} className="p-2 bg-white border border-gray-200 rounded-lg disabled:opacity-30 shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Location Form / Tree Placeholder */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center justify-between">
                            倉庫架構管理
                            <button onClick={() => { setEditingLoc({}); setIsLocModalOpen(true); }} className="bg-green-600 text-white p-1.5 rounded-lg shadow-lg hover:bg-green-700 transition-all"><Plus className="w-4 h-4" /></button>
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 font-bold leading-relaxed">在這裡建立您的「倉庫 &gt; 櫃位 &gt; 層架」層級。具體的「區/櫃/號」可在設備詳情中細分。</p>
                        
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {loadingLocs ? (
                                <div className="text-center py-4 text-gray-400 italic">載入中...</div>
                            ) : locations?.map(loc => (
                                <div key={loc.uuid} className="group p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-gray-700 truncate">{loc.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold truncate">{loc.full_path}</div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingLoc(loc); setIsLocModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => window.confirm('確定刪除？') && deleteLocMutation.mutate(loc.uuid)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Map or Stats Placeholder */}
                <div className="lg:col-span-2">
                    <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10">
                        <div className="bg-white p-6 rounded-full shadow-xl shadow-primary/10 mb-6"><MapPin className="w-12 h-12 text-primary" /></div>
                        <h4 className="text-xl font-black text-primary mb-2">視覺化地圖功能</h4>
                        <p className="text-gray-500 text-sm max-w-sm font-bold">未來將支援上傳倉庫平面圖並在上面標記設備位置。目前請使用「位置盤點」標籤頁進行大量設備調撥。</p>
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* Move Modal (The core operational logic) */}
      {movingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 leading-tight">
                            {isTargetMode ? '設定轉移目標' : '指派位置資訊'}
                        </h3>
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
                        {isTargetMode ? (
                            <button 
                                type="button" 
                                disabled={equipmentMutation.isPending}
                                onClick={() => handleMoveAction(true)}
                                className="w-full py-4 bg-orange-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowRightLeft className="w-4 h-4" /> 確認設定轉移目標
                            </button>
                        ) : (
                            <button 
                                type="button"
                                disabled={equipmentMutation.isPending}
                                onClick={() => handleMoveAction(false)}
                                className="w-full py-4 bg-green-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> 確認立即更新位置
                            </button>
                        )}
                        <button type="button" onClick={() => setMovingItem(null)} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm">取消</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Location Structure Add/Edit Modal */}
      {isLocModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
