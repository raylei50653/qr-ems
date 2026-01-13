import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { bulkDeleteEquipment, getEquipmentList } from '../../api/equipment';
import { ArrowLeft, Trash2, AlertTriangle, Box, CheckCircle } from 'lucide-react';

export const EquipmentBulkDeletePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedUuids = location.state?.uuids || [];

  // Fetch only the items that are selected to display them (optional but safer)
  // For simplicity, we just list them if they were passed, or use the list cache
  const { data: allEquipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => getEquipmentList(1, '', '', '', ''),
    enabled: selectedUuids.length > 0
  });

  const selectedItems = allEquipment?.results.filter(i => selectedUuids.includes(i.uuid)) || [];

  const bulkDeleteMutation = useMutation({
    mutationFn: () => bulkDeleteEquipment(selectedUuids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      alert(`已成功刪除 ${selectedUuids.length} 項設備`);
      navigate('/admin/equipment', { replace: true });
    },
    onError: (err: Error) => {
      // @ts-expect-error - Temporary until we define custom error type
      const detail = err.response?.data?.detail;
      alert('批量刪除失敗：' + (detail || err.message));
    }
  });

  const handleConfirmDelete = () => {
    bulkDeleteMutation.mutate();
  };

  if (selectedUuids.length === 0) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <p className="text-gray-500">未選取任何設備。</p>
                <button onClick={() => navigate('/admin/equipment')} className="text-blue-600 font-bold underline">返回列表</button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
        <div className="bg-red-600 p-6 text-white text-center">
            <div className="inline-flex bg-white/20 p-3 rounded-full mb-3">
                <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black uppercase">批量刪除確認</h1>
            <p className="text-red-100 mt-1">您即將永久移除 {selectedUuids.length} 項設備</p>
        </div>

        <div className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                    {selectedItems.map(item => (
                        <li key={item.uuid} className="p-3 flex items-center gap-3">
                            <Box className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="flex-1 truncate text-sm font-bold text-gray-700">{item.name}</div>
                            <span className="text-[10px] text-gray-400 font-mono">{item.uuid.split('-')[0]}...</span>
                        </li>
                    ))}
                    {selectedItems.length === 0 && <li className="p-4 text-center text-xs text-gray-400">正在確認項目明細...</li>}
                </ul>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                    注意：此操作無法復原。刪除後，這些設備的所有借用歷史、位置紀錄以及 RDF 元數據都將被永久移除。
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={handleConfirmDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-lg hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-5 h-5" />
                    {bulkDeleteMutation.isPending ? '正在執行批量刪除...' : `確認永久刪除這 ${selectedUuids.length} 項設備`}
                </button>
                
                <button
                    onClick={() => navigate('/admin/equipment')}
                    disabled={bulkDeleteMutation.isPending}
                    className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all flex items-center justify-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    取消並返回
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
