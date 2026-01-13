import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import type { Category } from '../../types';
import { ArrowLeft, Tag, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CategoryManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Category> | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      alert('類別已建立');
    },
    onError: (err: Error) => alert('建立失敗: ' + err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      alert('類別已更新');
    },
    onError: (err: Error) => alert('更新失敗: ' + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      alert('類別已刪除');
    },
    onError: (err: Error) => alert('刪除失敗: ' + err.message)
  });

  const handleEdit = (item: Category) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('確定要刪除此類別嗎？這不會刪除設備，但會移除該設備的類別標籤。')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.id) {
      updateMutation.mutate({ id: editingItem.id, data: editingItem });
    } else {
      createMutation.mutate(editingItem);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={() => navigate('/admin/equipment')} className="mr-4 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold flex items-center text-gray-800">
                <Tag className="mr-2 h-6 w-6 text-primary" />
                類別管理
            </h1>
        </div>
        <button 
            onClick={handleCreate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
            <Plus className="h-5 w-5" /> 新增類別
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 italic">載入中...</div>
        ) : (
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">描述</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories?.results?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/40" />
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 truncate max-w-md">{item.description || '無描述'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 transition-colors">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!categories?.results || categories.results.length === 0) && (
                    <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">尚未建立任何類別</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-black text-gray-800">
                        {editingItem.id ? '編輯類別' : '新增類別'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">類別名稱</label>
                            <input 
                                type="text" 
                                required
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors"
                                value={editingItem.name || ''}
                                onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                placeholder="例如：消耗品、精密儀器"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">描述 (選填)</label>
                            <textarea 
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold focus:border-primary outline-none transition-colors"
                                rows={3}
                                value={editingItem.description || ''}
                                onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                                placeholder="簡單說明此類別的用途"
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all">取消</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all" disabled={updateMutation.isPending || createMutation.isPending}>
                            <Save className="h-4 w-4 mr-2 inline" />
                            儲存
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
