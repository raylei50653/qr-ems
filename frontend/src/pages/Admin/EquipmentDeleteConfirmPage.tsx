import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentDetail, deleteEquipment } from '../../api/equipment';
import { ArrowLeft, Trash2, AlertTriangle, Box, MapPin } from 'lucide-react';

export const EquipmentDeleteConfirmPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ['equipment', uuid],
    queryFn: () => getEquipmentDetail(uuid!),
    enabled: !!uuid,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEquipment(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      alert('設備已成功刪除');
      navigate('/admin/equipment', { replace: true });
    },
    onError: (err: Error) => {
      // @ts-ignore
      const detail = err.response?.data?.detail;
      alert('刪除失敗：' + (detail || err.message));
    }
  });

  const handleCancel = () => {
    navigate('/admin/equipment');
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 text-lg">載入設備資訊中...</div>;
  if (isError || !equipment) return <div className="p-8 text-center text-red-500 text-lg">找不到該設備。</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
        {/* Warning Header */}
        <div className="bg-red-600 p-6 text-white text-center">
            <div className="inline-flex bg-white/20 p-3 rounded-full mb-3">
                <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">危險操作確認</h1>
            <p className="text-red-100 mt-1 font-medium">刪除後將無法恢復此設備數據</p>
        </div>

        <div className="p-8 space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-center">
                <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2">
                    {equipment.image ? (
                        <img src={equipment.image} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                        <Box className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-800 leading-tight">{equipment.name}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate px-4">{equipment.uuid}</p>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-bold bg-white/50 py-1.5 rounded-lg border border-gray-100">
                    <MapPin className="w-3 h-3" />
                    {equipment.location_details?.full_path || '未知倉庫'}
                    {equipment.zone && <span> • {equipment.zone}</span>}
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center px-4">
                    您確定要永久刪除此設備嗎？<br/>這將同時移除其所有的<b>借用紀錄</b>與<b>搬運歷史</b>。
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleConfirmDelete}
                        disabled={deleteMutation.isPending}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-lg hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        {deleteMutation.isPending ? '正在刪除...' : '確認永久刪除'}
                    </button>
                    
                    <button
                        onClick={handleCancel}
                        disabled={deleteMutation.isPending}
                        className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回管理頁面
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
