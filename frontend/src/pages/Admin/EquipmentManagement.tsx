import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentList, updateEquipment, createEquipment } from '../../api/equipment';
import { getLocations } from '../../api/locations';

import { getCategories } from '../../api/categories';
import type { Equipment, Category } from '../../types';
import { ArrowLeft, Box, Edit, Plus, X, Save, Search, Filter, Camera, Trash2, ChevronLeft, ChevronRight, Tag, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EquipmentStatusBadge } from '../../components/Equipment/EquipmentStatusBadge';
import { LocationDisplay } from '../../components/Equipment/LocationDisplay';
import { compressImage } from '../../utils/imageCompression';

// ... (STATUSES and EDIT_STATUSES constants remain same)
const STATUSES = [
  { value: '', label: '所有狀態' },
  { value: 'AVAILABLE', label: '可借用' },
  { value: 'BORROWED', label: '已借出' },
  { value: 'PENDING_RETURN', label: '待歸還' },
  { value: 'MAINTENANCE', label: '維護中' },
  { value: 'TO_BE_MOVED', label: '需移動' },
  { value: 'IN_TRANSIT', label: '移動中' },
  { value: 'LOST', label: '遺失' },
  { value: 'DISPOSED', label: '已報廢' },
];

const EDIT_STATUSES = [
  { value: 'AVAILABLE', label: '可借用' },
  { value: 'BORROWED', label: '已借出' },
  { value: 'PENDING_RETURN', label: '待歸還' },
  { value: 'MAINTENANCE', label: '維護中' },
  { value: 'TO_BE_MOVED', label: '需移動' },
  { value: 'IN_TRANSIT', label: '移動中' },
  { value: 'LOST', label: '遺失' },
  { value: 'DISPOSED', label: '已報廢' },
];

export const EquipmentManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(''); // Selected category ID
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Equipment> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', page, search, category, status, location],
    queryFn: () => getEquipmentList(page, search, category, status, location),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });



  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<Equipment> | FormData }) => updateEquipment(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
      setEditingItem(null);
      setSelectedFile(null);
      alert('更新成功');
    },
    onError: (err: any) => alert('更新失敗: ' + err.message)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Equipment> | FormData) => createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
      setEditingItem(null);
      setSelectedFile(null);
      alert('建立成功');
    },
    onError: (err: any) => alert('建立失敗: ' + err.message)
  });

  const handleEdit = (item: Equipment) => {
    setEditingItem({
        ...item,
        category: item.category || item.category_details?.id,
        location: item.location || item.location_details?.uuid
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    navigate(`/admin/equipment/delete/${item.uuid}`);
  };

  const handleCreate = () => {
    setEditingItem({ 
        name: '', 
        description: '', 
        category: undefined, 
        status: 'AVAILABLE',
        location: location || '',
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData();
    formData.append('name', editingItem.name || '');
    formData.append('description', editingItem.description || '');
    
    if (editingItem.category) {
        formData.append('category', editingItem.category.toString());
    }
    
    formData.append('status', editingItem.status || 'AVAILABLE');
    
    if (editingItem.location) {
        formData.append('location', editingItem.location);
    }
    
    if (editingItem.zone) formData.append('zone', editingItem.zone);
    if (editingItem.cabinet) formData.append('cabinet', editingItem.cabinet);
    if (editingItem.number) formData.append('number', editingItem.number);

    if (selectedFile) {
        setIsCompressing(true);
        try {
            const compressedFile = await compressImage(selectedFile);
            formData.append('image', compressedFile);
            formData.append('transaction_image', compressedFile);
        } catch (error) {
            console.error("Compression failed, using original", error);
            formData.append('image', selectedFile);
            formData.append('transaction_image', selectedFile);
        } finally {
            setIsCompressing(false);
        }
    }

    if (editingItem.uuid) {
      updateMutation.mutate({ uuid: editingItem.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... (Header and Main content remains same) ... */}
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={() => navigate('/', { replace: true })} className="mr-4 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold flex items-center text-gray-800">
                <Box className="mr-2 h-6 w-6 text-primary" />
                設備管理
            </h1>
        </div>
        <div className="flex gap-2 text-sm">

            <button onClick={() => navigate('/admin/categories')} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors font-bold shadow-sm">
                <Tag className="h-5 w-5" /> 類別管理
            </button>
            <button onClick={() => navigate('/admin/equipment/removal')} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-100 transition-colors shadow-sm">
                <Trash2 className="h-5 w-5" /> 移除設備
            </button>
            <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm">
                <Plus className="h-5 w-5" /> 新增設備
            </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input type="text" placeholder="搜尋設備..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
            </div>
            <div className="flex gap-2">
                <select
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                    className="bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                    <option value="">所有倉庫</option>
                    {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                </select>
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    >
                        <option value="">所有類別</option>
                        {categories?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm">
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500 italic">載入中...</div>
        ) : (
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">名稱 / 描述</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">類別</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">目前位置</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">目標目的地</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.results.map((item) => (
                  <tr key={item.uuid} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                        {item.category_details?.name || '未分類'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EquipmentStatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <LocationDisplay 
                            location={item.location_details}
                            zone={item.zone}
                            cabinet={item.cabinet}
                            number={item.number}
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <LocationDisplay 
                            isTarget
                            location={item.target_location_details}
                            zone={item.target_zone}
                            cabinet={item.target_cabinet}
                            number={item.target_number}
                            placeholder="無"
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 transition-colors flex items-center gap-1">
                          <Edit className="h-4 w-4" /> 編輯
                        </button>
                        <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1">
                          <Trash2 className="h-4 w-4" /> 刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {data && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!data.previous} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">上一頁</button>
                        <button onClick={() => setPage(p => p + 1)} disabled={!data.next} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">下一頁</button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <p className="text-xs font-bold text-gray-500">顯示第 <span className="text-gray-800">{((page - 1) * 10) + 1}</span> 到 <span className="text-gray-800">{Math.min(page * 10, data.count)}</span> 筆，共 <span className="text-gray-800">{data.count}</span> 筆</p>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!data.previous} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-bold text-gray-700">頁次 {page} / {Math.ceil(data.count / 10) || 1}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={!data.next} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="text-xl font-black text-gray-800">{editingItem.uuid ? '編輯設備' : '新增設備'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col overflow-hidden flex-1">
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">設備名稱</label>
                            <input type="text" required className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">描述</label>
                            <textarea className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors" rows={3} value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">設備圖片</label>
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all relative overflow-hidden bg-gray-50/50 group">
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                                {selectedFile ? <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-full object-contain" /> : editingItem.image ? (
                                    <div className="relative h-full w-full flex items-center justify-center group">
                                        <img src={editingItem.image} alt="Current" className="h-full object-contain opacity-50 group-hover:opacity-30 transition-opacity" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600"><Camera className="h-8 w-8 mb-2" /><span className="text-xs font-bold">點擊更換照片</span></div>
                                    </div>
                                ) : <div className="flex flex-col items-center text-gray-400 group-hover:scale-110 transition-transform"><Camera className="h-8 w-8 mb-2" /><span className="text-xs font-bold">拍攝或上傳照片</span></div>}
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">類別</label>
                                <select className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors bg-white" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: Number(e.target.value)})}>
                                    <option value="">請選擇類別</option>
                                    {categories?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">狀態</label>
                                <select className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors bg-white" value={editingItem.status || 'AVAILABLE'} onChange={e => setEditingItem({...editingItem, status: e.target.value as any})}>
                                    {EDIT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">存放倉庫</label>
                                <select 
                                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors bg-white" 
                                    value={editingItem.location || ''} 
                                    onChange={e => setEditingItem({...editingItem, location: e.target.value})}
                                >
                                    <option value="">請選擇倉庫</option>
                                    {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: '區', field: 'zone', options: ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'] },
                                    { label: '櫃', field: 'cabinet', options: Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']) },
                                    { label: '號', field: 'number', options: Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']) }
                                ].map((cfg) => (
                                    <div key={cfg.field}>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{cfg.label}</label>
                                        <select 
                                            className="w-full border-2 border-gray-100 rounded-lg px-2 py-2 text-xs font-bold focus:border-primary outline-none bg-white"
                                            value={(editingItem as any)[cfg.field] || ''}
                                            onChange={e => setEditingItem({...editingItem, [cfg.field]: e.target.value})}
                                        >
                                            <option value="">無</option>
                                            {cfg.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all">取消</button>
                        <button type="submit" className="px-8 py-2 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all" disabled={updateMutation.isPending || createMutation.isPending || isCompressing}>
                            <Save className="h-4 w-4 mr-2 inline" />{isCompressing ? '處理圖片中...' : (updateMutation.isPending || createMutation.isPending ? '儲存中...' : '儲存')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};


