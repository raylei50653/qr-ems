import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../../../api/locations';
import { getEquipmentList, updateEquipment } from '../../../api/equipment';
import type { Location, Equipment } from '../../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Plus, Search, X, ArrowLeft, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../../api/client';
import { PaginatedResponse } from '../../../types';

export const LocationManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({ name: '', description: '', parent: '' });
  const [showQR, setShowQR] = useState<string | null>(null);
  const [inventoryLocation, setInventoryLocation] = useState<Location | null>(null);
  const [addEquipmentId, setAddEquipmentId] = useState('');
  const [isTargeting, setIsTargeting] = useState(false); // Toggle between adding to current vs setting as target

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });

  // ... (rest of the logic remains same)
  // Fetch inventory for the selected location (currently here)
  const { data: inventory, isLoading: loadingInventory } = useQuery({
    queryKey: ['equipment', 'location', inventoryLocation?.uuid],
    queryFn: () => getEquipmentList(1, '', '', '', inventoryLocation?.uuid),
    enabled: !!inventoryLocation,
  });

  // Fetch equipment that HAS this location as target
  const { data: targetedEquipment, isLoading: loadingTargeted } = useQuery({
    queryKey: ['equipment', 'target_location', inventoryLocation?.uuid],
    queryFn: async () => {
        const { data } = await client.get<PaginatedResponse<Equipment>>('/equipment/', {
            params: { target_location: inventoryLocation?.uuid }
        });
        return data;
    },
    enabled: !!inventoryLocation,
  });

  const createMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setNewLocation({ name: '', description: '', parent: '' });
      setIsAddModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<Location> }) => updateLocation(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setEditingLocation(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const addToInventoryMutation = useMutation({
    mutationFn: ({ uuid, location, isTarget }: { uuid: string; location: string; isTarget: boolean }) => {
        const payload: any = isTarget ? { 
            target_location: location,
            status: 'TO_BE_MOVED' 
        } : { 
            location: location,
            target_location: null // Clear target if arrived
        };
        return updateEquipment(uuid, payload);
    },
    onSuccess: () => {
      alert('操作成功');
      setAddEquipmentId('');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
    onError: (err: any) => {
        alert('操作失敗: ' + (err.response?.data?.detail || '找不到設備或 UUID 錯誤'));
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newLocation.name,
      description: newLocation.description,
      parent: newLocation.parent || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateMutation.mutate({
        uuid: editingLocation.uuid,
        data: {
          name: editingLocation.name,
          description: editingLocation.description,
          parent: editingLocation.parent || undefined,
        },
      });
    }
  };

  const handleAddEquipment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inventoryLocation || !addEquipmentId) return;
      
      const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const match = addEquipmentId.match(uuidPattern);
      const uuid = match ? match[0] : addEquipmentId;

      addToInventoryMutation.mutate({ uuid, location: inventoryLocation.uuid, isTarget: isTargeting });
  };

  if (isLoading) return <div className="p-4">Loading locations...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold flex items-center text-gray-800">
                <Warehouse className="mr-2 h-6 w-6 text-primary" />
                儲存位置管理
            </h1>
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
            <Plus className="h-5 w-5" /> 新增位置
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Locations List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完整路徑</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {locations?.map((location) => (
                <tr key={location.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{location.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.full_path}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onClick={() => setInventoryLocation(location)}
                        className="text-green-600 hover:text-green-900 mr-4 inline-flex items-center gap-1"
                    >
                        <Box className="w-4 h-4" /> 庫存
                    </button>
                    <button
                        onClick={() => setShowQR(location.uuid)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                        QR Code
                    </button>
                    <button
                        onClick={() => setEditingLocation(location)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                        編輯
                    </button>
                    <button
                        onClick={() => {
                        if (window.confirm('確定要刪除此位置嗎？')) {
                            deleteMutation.mutate(location.uuid);
                        }
                        }}
                        className="text-red-600 hover:text-red-900"
                    >
                        刪除
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </main>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">新增位置</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">位置名稱</label>
                    <input
                        type="text"
                        placeholder="e.g., A區-01櫃"
                        className="mt-1 block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <input
                        type="text"
                        className="mt-1 block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newLocation.description}
                        onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">父級位置 (選填)</label>
                    <select
                        className="mt-1 block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newLocation.parent}
                        onChange={(e) => setNewLocation({ ...newLocation, parent: e.target.value })}
                    >
                        <option value="">無 (建立為頂層位置)</option>
                        {locations?.map((loc) => (
                        <option key={loc.uuid} value={loc.uuid}>
                            {loc.full_path}
                        </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? '儲存中...' : '建立位置'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {inventoryLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">位置庫存管理</h3>
                        <p className="text-sm text-gray-500">{inventoryLocation.full_path}</p>
                    </div>
                    <button onClick={() => setInventoryLocation(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Add Item Form */}
                    <form onSubmit={handleAddEquipment} className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-blue-800">指定設備到此位置</label>
                            <div className="flex bg-white rounded-md p-1 border border-blue-200">
                                <button 
                                    type="button" 
                                    onClick={() => setIsTargeting(false)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${!isTargeting ? 'bg-blue-600 text-white' : 'text-blue-600'}`}
                                >
                                    直接入庫
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsTargeting(true)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${isTargeting ? 'bg-orange-600 text-white' : 'text-orange-600'}`}
                                >
                                    設為目標 (需移動)
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input 
                                    type="text" 
                                    placeholder={isTargeting ? "指定設備的目的地為此..." : "掃描設備 QR Code 以立即入庫..."}
                                    className="w-full pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={addEquipmentId}
                                    onChange={e => setAddEquipmentId(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={addToInventoryMutation.isPending}
                                className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors ${isTargeting ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                <Plus className="h-4 w-4" /> {isTargeting ? '指定' : '入庫'}
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current Inventory */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Box className="w-4 h-4 text-green-600" />
                                在庫設備 ({inventory?.count || 0})
                            </h4>
                            {loadingInventory ? (
                                <div className="text-center py-4 text-gray-500">載入中...</div>
                            ) : inventory?.results && inventory.results.length > 0 ? (
                                <div className="space-y-2">
                                    {inventory.results.map((item: Equipment) => (
                                        <div key={item.uuid} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" className="w-full h-full object-cover rounded" />
                                                    ) : (
                                                        <Box className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 leading-tight">{item.name}</div>
                                                    <div className="text-[10px] text-gray-500">{item.status}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    無在庫設備
                                </div>
                            )}
                        </div>

                        {/* Expected / Targeted Inventory */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-orange-600" />
                                預計移入 ({targetedEquipment?.count || 0})
                            </h4>
                            {loadingTargeted ? (
                                <div className="text-center py-4 text-gray-500">載入中...</div>
                            ) : targetedEquipment?.results && targetedEquipment.results.length > 0 ? (
                                <div className="space-y-2">
                                    {targetedEquipment.results.map((item: Equipment) => (
                                        <div key={item.uuid} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
                                                    <Box className="w-4 h-4 text-orange-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 leading-tight">{item.name}</div>
                                                    <div className="text-[10px] text-orange-600 font-medium">目前在: {item.location_details?.full_path || '未指定'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    無預計移入設備
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">編輯位置</h2>
                <button onClick={() => setEditingLocation(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">名稱</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  className="mt-1 block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingLocation.description}
                  onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? '更新中...' : '儲存變更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">位置 QR Code</h2>
            <div className="bg-white p-4 border-2 border-gray-100 inline-block mb-4 rounded-xl">
              <QRCodeSVG 
                value={`location:${showQR}`} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm font-medium text-gray-800 mb-1">{locations?.find(l => l.uuid === showQR)?.name}</p>
            <p className="text-xs text-gray-500 mb-6">{locations?.find(l => l.uuid === showQR)?.full_path}</p>
            <button
              onClick={() => setShowQR(null)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
