import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getEquipmentDetail } from '../../api/equipment';
import { transactionsApi } from '../../api/transactions';
import { ArrowLeft, Calendar, FileText, AlertCircle } from 'lucide-react';

export const BorrowPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');

  // Fetch Equipment Details
  const { data: equipment, isLoading, error } = useQuery({
    queryKey: ['equipment', uuid],
    queryFn: () => getEquipmentDetail(uuid!),
    enabled: !!uuid,
  });

  // Borrow Mutation
  const borrowMutation = useMutation({
    mutationFn: transactionsApi.borrow,
    onSuccess: () => {
      alert('借用成功！'); 
      navigate(`/equipment/${uuid}`);
    },
    onError: (err: any) => {
      console.error(err);
      alert('借用失敗：' + (err.response?.data?.detail || err.message));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) return;

    borrowMutation.mutate({
      equipment_uuid: uuid,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      reason: reason,
    });
  };

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  // Calculate min date (today)
  const today = new Date().toISOString().split('T')[0];

  if (isLoading) return <div className="p-8 text-center text-gray-500">載入中...</div>;
  if (error || !equipment) return <div className="p-8 text-center text-red-500">找不到設備或發生錯誤</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
         <button onClick={handleBack} className="mr-4 p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
         </button>
         <h1 className="text-lg font-bold text-gray-800">借用設備</h1>
      </div>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        
        {/* Equipment Info Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{equipment.name}</h2>
          <p className="text-gray-500 text-sm mb-4">UUID: {equipment.uuid}</p>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${equipment.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {equipment.status}
            </span>
          </div>

          {equipment.status !== 'AVAILABLE' && (
             <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                   此設備目前狀態為非可用（{equipment.status}），可能無法借用。
                </p>
             </div>
          )}
        </div>

        {/* Borrow Form */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-6">
           
           {/* Due Date Input */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
                預計歸還日期 (選填)
             </label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  min={today}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
             </div>
           </div>

           {/* Reason Input */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
                借用原因 / 備註
             </label>
             <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="請輸入借用用途..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                />
             </div>
           </div>

           <button
             type="submit"
             disabled={equipment.status !== 'AVAILABLE' || borrowMutation.isPending}
             className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-sm transition-all
               ${(equipment.status !== 'AVAILABLE' || borrowMutation.isPending)
                 ? 'bg-gray-400 cursor-not-allowed' 
                 : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
               }`}
           >
             {borrowMutation.isPending ? '提交中...' : '確認借用'}
           </button>

        </form>

      </div>
    </div>
  );
};
