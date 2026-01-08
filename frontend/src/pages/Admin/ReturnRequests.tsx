import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../../api/transactions';
import { getLocations } from '../../api/locations';
import type { Transaction } from '../../api/transactions';
import { CheckCircle, XCircle, Clock, User, Box, MapPin, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LOCATION_ZONES = ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'];
const LOCATION_CABINETS = Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']);
const LOCATION_NUMBERS = Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']);

export const ReturnRequests = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'PENDING_APPROVAL' | 'ALL'>('PENDING_APPROVAL');
  
  // Approval Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvingTxn, setApprovingTxn] = useState<Transaction | null>(null);
  const [location, setLocation] = useState('');
  const [zone, setZone] = useState('');
  const [cabinet, setCabinet] = useState('');
  const [number, setNumber] = useState('');

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: async () => {
      const params: any = {};
      if (filter === 'PENDING_APPROVAL') {
        params.status = 'PENDING_APPROVAL';
      }
      return await transactionsApi.getTransactions(params);
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
    enabled: isModalOpen,
  });

  const approveMutation = useMutation({
    mutationFn: (vars: { id: number; data?: any }) => transactionsApi.approveReturn(vars.id, vars.data),
    onSuccess: () => {
      alert('已批准歸還');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => alert('操作失敗: ' + err.message)
  });

  const handleOpenApprove = (txn: Transaction) => {
    setApprovingTxn(txn);
    setLocation(txn.equipment_detail?.location || '');
    setZone(txn.equipment_detail?.zone || '');
    setCabinet(txn.equipment_detail?.cabinet || '');
    setNumber(txn.equipment_detail?.number || '');
    setIsModalOpen(true);
  };

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingTxn) return;
    
    approveMutation.mutate({ 
        id: approvingTxn.id, 
        data: { location, zone, cabinet, number } 
    });
  };

  const rejectMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.rejectReturn(id, 'Admin rejected'), // Simple reason for now
    onSuccess: () => {
      alert('已拒絕歸還');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => alert('操作失敗: ' + err.message)
  });

  if (isLoading) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">歸還申請管理</h1>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700">回到儀表板</button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('PENDING_APPROVAL')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors
              ${filter === 'PENDING_APPROVAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            待審核
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors
              ${filter === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            所有記錄
          </button>
        </div>

        <div className="space-y-4">
          {transactions && transactions.length > 0 ? (
            transactions.map((txn) => (
              <div key={txn.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex-1 space-y-1">
                   <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <Box className="w-4 h-4 text-gray-500" />
                      {txn.equipment_detail?.name || '未知設備'} 
                      <span className="text-xs text-gray-400 font-normal">({txn.equipment})</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-3.5 h-3.5" />
                      申請人: {txn.user_detail?.username || txn.user}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(txn.created_at).toLocaleString()}
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   {txn.status === 'PENDING_APPROVAL' ? (
                     <>
                        <button
                          onClick={() => handleOpenApprove(txn)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> 批准
                        </button>
                        <button
                          onClick={() => {
                             const reason = prompt("請輸入拒絕原因:");
                             if (reason) rejectMutation.mutate(txn.id);
                          }}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> 拒絕
                        </button>
                     </>
                   ) : (
                     <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${txn.status === 'COMPLETED' ? 'bg-gray-50 text-gray-600 border-gray-200' : 
                          'bg-red-50 text-red-600 border-red-200'}`}>
                        {txn.status === 'COMPLETED' ? '已完成' : '已拒絕'}
                     </span>
                   )}
                </div>

              </div>
            ))
          ) : (
             <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                目前沒有{filter === 'PENDING_APPROVAL' ? '待審核' : ''}的歸還申請
             </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {isModalOpen && approvingTxn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">核准設備歸還</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleConfirmApprove}>
                    <div className="p-6 space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                            <p className="text-xs text-blue-600 font-bold mb-1">歸還設備</p>
                            <p className="text-sm font-bold text-gray-800">{approvingTxn.equipment_detail?.name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">確認存放倉庫</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <select 
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                >
                                    <option value="">選擇倉庫</option>
                                    {locations?.map(loc => (
                                        <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">區</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={zone}
                                    onChange={e => setZone(e.target.value)}
                                >
                                    <option value="">選擇</option>
                                    {LOCATION_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">櫃</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={cabinet}
                                    onChange={e => setCabinet(e.target.value)}
                                >
                                    <option value="">選擇</option>
                                    {LOCATION_CABINETS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">號</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                >
                                    <option value="">選擇</option>
                                    {LOCATION_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic">核准後，設備將自動恢復為「可借用」狀態，並更新至上述位置。</p>
                    </div>

                    <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold"
                            disabled={approveMutation.isPending}
                        >
                            <CheckCircle className="h-4 w-4" />
                            {approveMutation.isPending ? '提交中...' : '確認核准歸還'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
