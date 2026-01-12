import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipmentList } from '../../api/equipment';
import { getCategories } from '../../api/categories';
import { getLocations } from '../../api/locations';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Search, QrCode, ScanLine, Users, Shield, Box, ChevronLeft, ChevronRight, Filter, Warehouse } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EquipmentStatusBadge } from '../../components/Equipment/EquipmentStatusBadge';
import { LocationDisplay } from '../../components/Equipment/LocationDisplay';

const STATUSES = [
  { value: '', label: '所有狀態' },
  { value: 'AVAILABLE', label: '可借用' },
  { value: 'BORROWED', label: '已借出' },
  { value: 'PENDING_RETURN', label: '待歸還' },
  { value: 'MAINTENANCE', label: '維護中' },
  { value: 'TO_BE_MOVED', label: '需移動' },
  { value: 'IN_TRANSIT', label: '移動中' },
  { value: 'LOST', label: '遺失' },
  { value: 'DISPOSED', label: '已報廢' },
];

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['equipment', page, search, category, status, location],
    queryFn: () => getEquipmentList(page, search, category, status, location),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <QrCode className="text-primary h-6 w-6" />
          <span className="text-xl font-bold text-primary">QR-EMS</span>
        </div>
        <div className="flex items-center space-x-4">
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <>
                <Link to="/admin/equipment" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors" title="設備管理">
                    <Box className="h-5 w-5" />
                    <span className="hidden sm:inline">設備管理</span>
                </Link>
                <Link to="/admin/returns" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors" title="歸還審核">
                    <Shield className="h-5 w-5" />
                    <span className="hidden sm:inline">歸還審核</span>
                </Link>
                <Link to="/admin/locations" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors" title="位置管理">
                    <Warehouse className="h-5 w-5" />
                    <span className="hidden sm:inline">位置管理</span>
                </Link>

            </>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin/users" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors" title="人員管理">
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">人員管理</span>
            </Link>
          )}
          <Link to="/scan" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors">
             <ScanLine className="h-5 w-5" />
             <span className="hidden sm:inline">掃描</span>
          </Link>
          <span className="text-sm text-gray-600 hidden sm:inline">你好, {user?.username}</span>
          <button 
            onClick={logout}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="登出"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">設備列表</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                type="text"
                placeholder="搜尋設備..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <div className="relative">
                    <select
                        value={location}
                        onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-w-[120px]"
                    >
                        <option value="">所有倉庫</option>
                        {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <Warehouse className="h-3 w-3" />
                    </div>
                </div>

                <div className="relative">
                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    >
                        <option value="">所有類別</option>
                        {categories?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <Filter className="h-3 w-3" />
                    </div>
                </div>

                <div className="relative">
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <Filter className="h-3 w-3" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">載入中...</div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500">無法載入設備列表。</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">名稱 / 描述</th>
                  <th className="px-6 py-3 text-left">類別</th>
                  <th className="px-6 py-3 text-left">狀態</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">目前位置</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">目標目的地</th>
                  <th className="px-6 py-3 text-left hidden sm:table-cell">持有者</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.results.map((item) => (
                  <tr key={item.uuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/equipment/${item.uuid}`)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800">
                            {item.category_details?.name || '未分類'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EquipmentStatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <LocationDisplay 
                            location={item.location_details}
                            zone={item.zone}
                            cabinet={item.cabinet}
                            number={item.number}
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <LocationDisplay 
                            isTarget
                            location={item.target_location_details}
                            zone={item.target_zone}
                            cabinet={item.target_cabinet}
                            number={item.target_number}
                            placeholder="無"
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {item.current_possession?.username || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/equipment/${item.uuid}`);
                      }}>查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {data && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={!data.previous}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            上一頁
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!data.next}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            下一頁
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                顯示第 <span className="font-medium">{((page - 1) * 10) + 1}</span> 到 <span className="font-medium">{Math.min(page * 10, data.count)}</span> 筆，共 <span className="font-medium">{data.count}</span> 筆
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!data.previous}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                
                                {/* Simple Page Indicator */}
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    頁次 {page} / {Math.ceil(data.count / 10) || 1}
                                </span>

                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!data.next}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {(!data?.results || data.results.length === 0) && (
               <div className="p-6 text-center text-gray-500">找不到符合條件的設備。</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};