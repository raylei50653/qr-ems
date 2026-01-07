import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentDetail, getEquipmentHistory } from '../../api/equipment';
import { transactionsApi } from '../../api/transactions';
import { ArrowLeft, Box, Activity, User as UserIcon, History, Clock, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const EquipmentDetailPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: loggedInUser } = useAuthStore(); // Get logged-in user info

  const statusMap: Record<string, string> = {
    AVAILABLE: '可借用',
    BORROWED: '已借出',
    PENDING_RETURN: '待歸還',
    MAINTENANCE: '維護中',
    LOST: '遺失',
    DISPOSED: '已報廢',
  };

  const actionMap: Record<string, string> = {
    BORROW: '借用',
    RETURN: '歸還',
    MAINTENANCE_IN: '送修',
    MAINTENANCE_OUT: '修復',
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

  const returnMutation = useMutation({
    mutationFn: transactionsApi.returnRequest,
    onSuccess: () => {
      alert('歸還申請已提交！');
      queryClient.invalidateQueries({ queryKey: ['equipment', uuid] });
      queryClient.invalidateQueries({ queryKey: ['equipment-history', uuid] });
    },
    onError: (err: any) => {
      console.error(err);
      alert('歸還失敗：' + (err.response?.data?.detail || err.message));
    },
  });

  const handleReturn = () => {
    if (window.confirm('確定要歸還此設備嗎？')) {
      if (uuid) {
        returnMutation.mutate({ equipment_uuid: uuid });
      }
    }
  };

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  // Determine if the return button should be shown and enabled
  const showReturnButton = equipment?.status === 'BORROWED' && equipment?.current_possession?.id === loggedInUser?.id;

  if (isLoading) return <div className="p-8 text-center">載入設備詳情...</div>;
  if (isError || !equipment) return <div className="p-8 text-center text-red-500">找不到設備。</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center text-white">
            <button onClick={handleBack} className="mr-4 hover:bg-white/10 p-1 rounded">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">設備詳情</h1>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
            
            {/* Equipment Image */}
            {equipment.image && (
                <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-gray-200">
                    <img 
                        src={equipment.image} 
                        alt={equipment.name} 
                        className="w-full h-full object-contain"
                    />
                </div>
            )}

            <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                <Box className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                <h2 className="text-2xl font-bold text-gray-900">{equipment.name}</h2>
                <p className="text-gray-500 mt-1">{equipment.description}</p>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">狀態</span>
                </div>
                <span className={`inline-block px-2 py-1 text-sm font-semibold rounded-full
                    ${equipment.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
                    equipment.status === 'BORROWED' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {statusMap[equipment.status] || equipment.status}
                </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <UserIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">目前持有</span>
                </div>
                <div className="font-medium text-gray-900">
                    {equipment.current_possession?.username || '無'}
                </div>
                </div>
            </div>

            {/* Location Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                 <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> 存放位置
                 </h3>
                 <div className="flex gap-4 text-gray-900 font-medium">
                    {equipment.zone && <span className="bg-white px-2 py-1 rounded border border-gray-200">{equipment.zone}</span>}
                    {equipment.cabinet && <span className="bg-white px-2 py-1 rounded border border-gray-200">{equipment.cabinet}</span>}
                    {equipment.number && <span className="bg-white px-2 py-1 rounded border border-gray-200">{equipment.number}</span>}
                    {!equipment.zone && !equipment.cabinet && !equipment.number && <span className="text-gray-400 font-normal italic">未指定位置</span>}
                 </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-6 flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm w-fit mx-auto">
                <p className="text-sm text-gray-500 mb-2 font-medium">設備 QR Code</p>
                <img 
                    src={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/equipment/${uuid}/qr/`} 
                    alt="Equipment QR Code" 
                    className="w-40 h-40" 
                />
                <p className="text-xs text-gray-400 mt-2">掃描以查看詳情</p>
            </div>
            
            <div className="text-xs text-gray-400 font-mono mt-4">
                UUID: {equipment.uuid}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
                {equipment.status === 'AVAILABLE' && (
                <button
                    onClick={() => navigate(`/borrow/${equipment.uuid}`)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
                >
                    借用設備
                </button>
                )}

                {showReturnButton && (
                <button
                    onClick={handleReturn}
                    disabled={returnMutation.isPending}
                    className="bg-amber-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    {returnMutation.isPending ? '提交中...' : '歸還設備'}
                </button>
                )}
            </div>
            </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-800">歷史紀錄</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {history && history.length > 0 ? (
                    history.map((txn) => (
                        <div key={txn.id} className="p-4 flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className={`w-2 h-2 rounded-full 
                                    ${txn.action === 'BORROW' ? 'bg-blue-500' : 
                                      txn.action === 'RETURN' ? 'bg-green-500' : 'bg-gray-400'}`} 
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-gray-900">
                                        {actionMap[txn.action] || txn.action}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(txn.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    操作者: {txn.user_detail?.username || '未知'}
                                </div>
                                {txn.reason && (
                                    <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded mt-1">
                                        備註: {txn.reason}
                                    </div>
                                )}
                                {txn.image && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-400 mb-1">狀態照片:</p>
                                        <a href={txn.image} target="_blank" rel="noopener noreferrer">
                                            <img 
                                                src={txn.image} 
                                                alt="Transaction Record" 
                                                className="h-20 w-auto object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity" 
                                            />
                                        </a>
                                    </div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                    狀態: {txn.status === 'COMPLETED' ? '完成' : 
                                           txn.status === 'PENDING_APPROVAL' ? '待審核' : '拒絕'}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        暫無歷史紀錄
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
