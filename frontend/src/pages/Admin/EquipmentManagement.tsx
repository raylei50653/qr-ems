import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentList, updateEquipment, createEquipment } from '../../api/equipment';
import type { Equipment } from '../../types';
import { ArrowLeft, Box, Edit, Plus, X, Save, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { value: '', label: '所有類別' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'PERIPHERALS', label: 'Peripherals' },
  { value: 'AUDIO_VIDEO', label: 'Audio/Video' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'DEV_BOARD', label: 'Development Board' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'NETWORK', label: 'Network Equipment' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'OTHER', label: 'Other' },
];

const STATUSES = [
  { value: '', label: '所有狀態' },
  { value: 'AVAILABLE', label: '可借用' },
  { value: 'BORROWED', label: '已借出' },
  { value: 'PENDING_RETURN', label: '待歸還' },
  { value: 'MAINTENANCE', label: '維護中' },
  { value: 'LOST', label: '遺失' },
  { value: 'DISPOSED', label: '已報廢' },
];

const EDIT_CATEGORIES = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'PERIPHERALS', label: 'Peripherals' },
  { value: 'AUDIO_VIDEO', label: 'Audio/Video' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'DEV_BOARD', label: 'Development Board' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'NETWORK', label: 'Network Equipment' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'OTHER', label: 'Other' },
];

const EDIT_STATUSES = [
  { value: 'AVAILABLE', label: '可借用' },
  { value: 'BORROWED', label: '已借出' },
  { value: 'PENDING_RETURN', label: '待歸還' },
  { value: 'MAINTENANCE', label: '維護中' },
  { value: 'LOST', label: '遺失' },
  { value: 'DISPOSED', label: '已報廢' },
];

export const EquipmentManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Equipment> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', page, search, category, status],
    queryFn: () => getEquipmentList(page, search, category, status),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<Equipment> }) => updateEquipment(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
      setEditingItem(null);
      alert('更新成功');
    },
    onError: (err: any) => alert('更新失敗: ' + err.message)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Equipment>) => createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsModalOpen(false);
      setEditingItem(null);
      alert('建立成功');
    },
    onError: (err: any) => alert('建立失敗: ' + err.message)
  });

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem({ name: '', description: '', category: 'OTHER', status: 'AVAILABLE' });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.uuid) {
      updateMutation.mutate({ uuid: editingItem.uuid, data: editingItem });
    } else {
      createMutation.mutate(editingItem);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold flex items-center text-gray-800">
                <Box className="mr-2 h-6 w-6 text-primary" />
                設備管理
            </h1>
        </div>
        <button 
            onClick={handleCreate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
            <Plus className="h-5 w-5" /> 新增設備
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                type="text"
                placeholder="搜尋設備名稱或描述..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            
            <div className="flex gap-2">
                <div className="relative">
                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <Filter className="h-3 w-3" />
                    </div>
                </div>

                <div className="relative">
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <Filter className="h-3 w-3" />
                    </div>
                </div>
            </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">載入中...</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名稱 / 描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類別</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.results.map((item) => (
                  <tr key={item.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
                          item.status === 'BORROWED' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {STATUSES.find(s => s.value === item.status)?.label || item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto">
                        <Edit className="h-4 w-4" /> 編輯
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        {editingItem.uuid ? '編輯設備' : '新增設備'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">設備名稱</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingItem.name || ''}
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            value={editingItem.description || ''}
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">類別</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={editingItem.category || 'OTHER'}
                                onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                            >
                                {EDIT_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={editingItem.status || 'AVAILABLE'}
                                onChange={e => setEditingItem({...editingItem, status: e.target.value})}
                            >
                                {EDIT_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            disabled={updateMutation.isPending || createMutation.isPending}
                        >
                            <Save className="h-4 w-4" />
                            {updateMutation.isPending || createMutation.isPending ? '儲存中...' : '儲存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
