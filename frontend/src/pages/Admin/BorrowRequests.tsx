import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../../api/transactions';
import type { Transaction } from '../../api/transactions';
import { CheckCircle, XCircle, Clock, User, Box, ArrowLeft, Shield, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BorrowRequests = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'PENDING_APPROVAL' | 'ALL'>('PENDING_APPROVAL');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'borrow', filter],
    queryFn: async () => {
      const params: any = { action: 'BORROW' };
      if (filter === 'PENDING_APPROVAL') {
        params.status = 'PENDING_APPROVAL';
      }
      return await transactionsApi.getTransactions(params);
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, admin_note }: { id: number, admin_note?: string }) => 
        transactionsApi.approveBorrow(id, admin_note),
    onSuccess: () => {
      alert('已批准借用');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => alert('操作失敗: ' + err.message)
  });

  const bulkApproveMutation = useMutation({
    mutationFn: ({ ids, admin_note }: { ids: number[], admin_note?: string }) => 
        transactionsApi.bulkApprove(ids, admin_note),
    onSuccess: (data) => {
      const successCount = data.success.length;
      const failedCount = data.failed.length;
      alert(`批量處理完成: ${successCount} 成功, ${failedCount} 失敗`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => alert('操作失敗: ' + err.message)
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.rejectBorrow(id, 'Admin rejected'),
    onSuccess: () => {
      alert('已拒絕借用');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => alert('操作失敗: ' + err.message)
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && transactions) {
        setSelectedIds(transactions.filter(t => t.status === 'PENDING_APPROVAL').map(t => t.id));
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-xl font-black tracking-tight">借用申請審核</h1>
            </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner border border-gray-200">
            <button 
                onClick={() => setFilter('PENDING_APPROVAL')}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${filter === 'PENDING_APPROVAL' ? 'bg-white text-primary shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
                待審核
            </button>
            <button 
                onClick={() => setFilter('ALL')}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${filter === 'ALL' ? 'bg-white text-primary shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
                所有記錄
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-black text-gray-700 uppercase tracking-widest">
                            <th className="px-6 py-4 text-left w-10">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    onChange={handleSelectAll}
                                    checked={transactions && transactions.length > 0 && selectedIds.length === transactions.filter(t => t.status === 'PENDING_APPROVAL').length}
                                />
                            </th>
                            <th className="px-6 py-4 text-left">申請設備</th>
                            <th className="px-6 py-4 text-left">申請人</th>
                            <th className="px-6 py-4 text-left">申請時間</th>
                            <th className="px-6 py-4 text-left">原因/備註</th>
                            <th className="px-6 py-4 text-left">狀態</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={7} className="px-6 py-20 text-center text-gray-400 italic font-bold">載入中...</td></tr>
                        ) : transactions && transactions.length > 0 ? (
                            transactions.map((txn) => (
                                <tr key={txn.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(txn.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        {txn.status === 'PENDING_APPROVAL' && (
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={selectedIds.includes(txn.id)}
                                                onChange={() => handleSelectOne(txn.id)}
                                            />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-800">{txn.equipment_detail?.name || '未知設備'}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{txn.equipment}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 p-1.5 rounded-full text-gray-500">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{txn.user_detail?.username || txn.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{new Date(txn.created_at).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {txn.reason && (
                                                <div className="flex items-start gap-2 text-gray-600 max-w-xs">
                                                    <FileText className="w-3.5 h-3.5 mt-1 shrink-0" />
                                                    <span className="text-xs">{txn.reason}</span>
                                                </div>
                                            )}
                                            {txn.admin_note && (
                                                <div className="flex items-start gap-2 text-primary font-bold max-w-xs">
                                                    <Shield className="w-3.5 h-3.5 mt-1 shrink-0" />
                                                    <span className="text-xs">管理員備註: {txn.admin_note}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {txn.status === 'PENDING_APPROVAL' ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                                                <AlertCircle className="w-3 h-3" /> 待審核
                                            </span>
                                        ) : txn.status === 'COMPLETED' ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                                <CheckCircle className="w-3 h-3" /> 已批准
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                                                <XCircle className="w-3 h-3" /> 已拒絕
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {txn.status === 'PENDING_APPROVAL' ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        const note = prompt(`確認批准 ${txn.user_detail?.username} 借用 ${txn.equipment_detail?.name}?\n您可以輸入核准備註(選填):`);
                                                        if(note !== null) {
                                                            approveMutation.mutate({ id: txn.id, admin_note: note });
                                                        }
                                                    }}
                                                    disabled={approveMutation.isPending}
                                                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-green-700 transition-all shadow-md shadow-green-100"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> 批准
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt("請輸入拒絕原因:");
                                                        if (reason) rejectMutation.mutate(txn.id);
                                                    }}
                                                    disabled={rejectMutation.isPending}
                                                    className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-red-50 transition-all"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> 拒絕
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} className="px-6 py-20 text-center text-gray-400 font-bold">目前沒有{filter === 'PENDING_APPROVAL' ? '待審核' : ''}的借用申請</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      {/* Floating Action Bar for Bulk Operations */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-3xl shadow-2xl border border-gray-100 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-800">已選取 {selectedIds.length} 項申請</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">批量操作</span>
              </div>
              <div className="h-8 w-px bg-gray-100"></div>
              <div className="flex gap-3">
                  <button 
                    onClick={() => {
                        const note = prompt(`您即將核准 ${selectedIds.length} 筆借用申請。\n您可以輸入統一的核准備註(選填):`);
                        if (note !== null) {
                            bulkApproveMutation.mutate({ ids: selectedIds, admin_note: note });
                        }
                    }}
                    disabled={bulkApproveMutation.isPending}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                      <CheckCircle className="w-4 h-4" /> 批量核准
                  </button>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="px-6 py-2.5 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-50 transition-all"
                  >
                      取消
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};