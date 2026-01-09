import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../../api/transactions';
import { getLocations } from '../../api/locations';
import type { Transaction } from '../../api/transactions';
import { CheckCircle, XCircle, Clock, User, Box, MapPin, X, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
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

  const rejectMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.rejectReturn(id, 'Admin rejected'),
    onSuccess: () => {
      alert('已拒絕歸還');
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-xl font-black tracking-tight">歸還申請審核</h1>
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
                            <th className="px-6 py-4 text-left">申請設備</th>
                            <th className="px-6 py-4 text-left">申請人</th>
                            <th className="px-6 py-4 text-left">申請時間</th>
                            <th className="px-6 py-4 text-left">狀態</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic font-bold">載入中...</td></tr>
                        ) : transactions && transactions.length > 0 ? (
                            transactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {txn.status === 'PENDING_APPROVAL' ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                                                <AlertCircle className="w-3 h-3" /> 待審核
                                            </span>
                                        ) : txn.status === 'COMPLETED' ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                                <CheckCircle className="w-3 h-3" /> 已完成
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
                                                    onClick={() => handleOpenApprove(txn)}
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
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold">目前沒有{filter === 'PENDING_APPROVAL' ? '待審核' : ''}的歸還申請</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      {/* Approval Modal */}
      {isModalOpen && approvingTxn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 leading-tight">核准設備歸還</h3>
                        <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">請確認歸還後的存放位置</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 rounded-2xl text-gray-400 hover:text-gray-600 shadow-sm transition-all"><X className="h-6 w-6" /></button>
                </div>
                
                <form onSubmit={handleConfirmApprove} className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl border-2 bg-blue-50/30 border-blue-100">
                            <label className="block text-xs font-black uppercase tracking-widest mb-2 text-blue-600">
                                歸還設備資訊
                            </label>
                            <div className="flex items-center gap-3">
                                <Box className="w-8 h-8 text-blue-500" />
                                <div>
                                    <div className="text-sm font-black text-gray-800">{approvingTxn.equipment_detail?.name}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{approvingTxn.equipment}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">確認存放倉庫</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                    <select 
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black shadow-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    >
                                        <option value="">選擇倉庫...</option>
                                        {locations?.map(loc => (
                                            <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">具體格位資訊</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[['區', zone, setZone, LOCATION_ZONES], ['櫃', cabinet, setCabinet, LOCATION_CABINETS], ['號', number, setNumber, LOCATION_NUMBERS]].map(([label, val, set, opts]) => (
                                        <div key={label as string}>
                                            <select 
                                                className="w-full bg-white border-2 border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-black focus:border-primary outline-none shadow-sm transition-all"
                                                value={val as string} onChange={e => (set as any)(e.target.value)}
                                            >
                                                <option value="">{label as string}</option>
                                                {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button 
                            type="submit"
                            className="w-full py-4 bg-green-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                            disabled={approveMutation.isPending}
                        >
                            <CheckCircle className="h-5 w-5" />
                            {approveMutation.isPending ? '提交中...' : '確認核准歸還'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm underline underline-offset-4"
                        >
                            取消
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};