import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../../api/transactions';
import type { Transaction } from '../../api/transactions';
import { CheckCircle, XCircle, Clock, User, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReturnRequests = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'PENDING_APPROVAL' | 'ALL'>('PENDING_APPROVAL');

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: async () => {
      const params: any = {};
      if (filter === 'PENDING_APPROVAL') {
        params.status = 'PENDING_APPROVAL';
      }
      // Backend now handles filtering and sorting (default by -created_at)
      return await transactionsApi.getTransactions(params);
    },
  });

  const approveMutation = useMutation({
    mutationFn: transactionsApi.approveReturn,
    onSuccess: () => {
      alert('已批准歸還');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => alert('操作失敗: ' + err.message)
  });

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
                          onClick={() => approveMutation.mutate(txn.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> 批准
                        </button>
                        <button
                          onClick={() => {
                             const reason = prompt("請輸入拒絕原因:");
                             if (reason) rejectMutation.mutate(txn.id); // TODO: Pass reason correctly if extended
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
    </div>
  );
};
