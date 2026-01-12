import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentList, bulkDeleteEquipment } from '../../api/equipment';
import { getCategories } from '../../api/categories';
import { getLocations } from '../../api/locations';
import type { Equipment } from '../../types';
import { ArrowLeft, Trash2, Search, Filter, Box, AlertTriangle, CheckSquare, Square, ChevronLeft, ChevronRight, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES_OPTIONS = [
  { value: '', label: '所有類別' },
];

const statusMap: Record<string, string> = {
    AVAILABLE: '可借用',
    BORROWED: '已借出',
    PENDING_RETURN: '待歸還',
    MAINTENANCE: '維護中',
    TO_BE_MOVED: '需移動',
    IN_TRANSIT: '移動中',
    LOST: '遺失',
    DISPOSED: '已報廢',
};

export const EquipmentRemovalPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(''); // Category ID
  const [location, setLocation] = useState('');
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });

  // Selection persists across pages because selectedUuids is state
  const { data, isLoading } = useQuery({
    queryKey: ['equipment', 'removal', page, search, category, location],
    queryFn: () => getEquipmentList(page, search, category, '', location),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bulkDeleteEquipment(selectedUuids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      alert(`成功移除 ${selectedUuids.length} 項設備`);
      setSelectedUuids([]);
      navigate('/admin/equipment');
    },
    onError: (err: any) => alert('刪除失敗: ' + err.message)
  });

  const toggleSelectAll = () => {
    if (selectedUuids.length === data?.results.length) {
      setSelectedUuids([]);
    } else {
      setSelectedUuids(data?.results.map(i => i.uuid) || []);
    }
  };

  const toggleSelect = (uuid: string) => {
    setSelectedUuids(prev => 
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const handleExecuteDelete = () => {
    if (selectedUuids.length === 0) return;
    if (window.confirm(`危險操作：確定要永久刪除這 ${selectedUuids.length} 項設備嗎？此動作不可復原。`)) {
        deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center">
            <button onClick={() => navigate('/admin/equipment')} className="mr-4 text-gray-600 hover:text-primary transition-colors">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
                <h1 className="text-xl font-black text-red-600 flex items-center gap-2">
                    <Trash2 className="h-6 w-6" /> 批量移除設備
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Danger Zone • Bulk Deletion</p>
            </div>
        </div>
        
        <button 
            onClick={handleExecuteDelete}
            disabled={selectedUuids.length === 0 || deleteMutation.isPending}
            className={`px-6 py-2 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg
                ${selectedUuids.length > 0 
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
        >
            {deleteMutation.isPending ? '正在移除...' : `執行移除 (${selectedUuids.length})`}
        </button>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {/* Warning Banner */}
        <div className="mb-6 bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-1" />
            <div>
                <h3 className="text-sm font-black text-red-800 uppercase">注意：正在進入批量刪除模式</h3>
                <p className="text-xs text-red-600 font-medium mt-1">
                    在此頁面選取的設備將在確認後被「永久移除」。這將同時清除該設備的所有交易歷史、借用狀態與關聯數據。
                </p>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder="搜尋欲移除的設備..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-red-500 outline-none transition-colors font-bold text-sm shadow-sm"
                />
            </div>
            <select
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                className="bg-white border-2 border-gray-100 text-gray-700 py-3 px-4 rounded-2xl font-bold text-sm focus:border-red-500 outline-none shadow-sm transition-colors"
            >
                <option value="">所有倉庫</option>
                {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
            </select>
            <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="bg-white border-2 border-gray-100 text-gray-700 py-3 px-4 rounded-2xl font-bold text-sm focus:border-red-500 outline-none shadow-sm transition-colors"
            >
                <option value="">所有類別</option>
                {categories?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {/* Selection List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleSelectAll}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                        {data?.results && selectedUuids.length === data.results.length ? (
                            <CheckSquare className="h-5 w-5 text-red-600" />
                        ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">全選此頁</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400">目前顯示 {data?.results?.length || 0} 項</span>
            </div>

            {isLoading ? (
                <div className="p-20 text-center text-gray-400 font-bold italic animate-pulse">載入清單中...</div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {data?.results.map((item) => (
                        <div 
                            key={item.uuid} 
                            onClick={() => toggleSelect(item.uuid)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-colors
                                ${selectedUuids.includes(item.uuid) ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}
                        >
                            <div className="shrink-0">
                                {selectedUuids.includes(item.uuid) ? (
                                    <CheckSquare className="h-6 w-6 text-red-600" />
                                ) : (
                                    <Square className="h-6 w-6 text-gray-200" />
                                )}
                            </div>
                            
                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                {item.image ? (
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Box className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-gray-800 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-400 font-mono truncate">{item.uuid}</p>
                            </div>

                            <div className="hidden sm:block text-right">
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded uppercase">
                                    {item.category_details?.name || '未分類'}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-1">{statusMap[item.status] || item.status}</p>
                            </div>
                        </div>
                    ))}
                    {(!data?.results || data.results.length === 0) && (
                        <div className="p-20 text-center text-gray-400 italic">找不到符合條件的設備。</div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {data && data.count > 10 && (
                <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                            disabled={!data.previous}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
                        >
                            上一頁
                        </button>
                        <button
                            onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                            disabled={!data.next}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
                        >
                            下一頁
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500">
                                顯示第 <span className="text-gray-800">{((page - 1) * 10) + 1}</span> 到 <span className="text-gray-800">{Math.min(page * 10, data.count)}</span> 筆，共 <span className="text-gray-800">{data.count}</span> 筆
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px bg-white border border-gray-200 overflow-hidden" aria-label="Pagination">
                                <button
                                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                                    disabled={!data.previous}
                                    className="relative inline-flex items-center px-3 py-2 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-100"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                
                                <span className="relative inline-flex items-center px-4 py-2 bg-white text-xs font-black text-gray-700 border-r border-gray-100 uppercase tracking-widest">
                                    頁次 {page} / {Math.ceil(data.count / 10)}
                                </span>

                                <button
                                    onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                                    disabled={!data.next}
                                    className="relative inline-flex items-center px-3 py-2 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};
