import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserList, updateUserRole } from '../../api/users';
import type { User, UserRole } from '../../types';
import { ArrowLeft, Users, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => getUserList(page, search),
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleRoleChange = (id: number, newRole: string) => {
    if (confirm(`確定要將此使用者的角色更改為 ${newRole} 嗎？`)) {
        mutation.mutate({ id, role: newRole as UserRole });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow p-4 flex items-center">
            <button onClick={() => navigate('/')} className="mr-4 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                人員管理
            </h1>
        </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-10">載入中...</div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500">無法載入使用者列表 (權限不足?)</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.results.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select 
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                            <option value="USER">User</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
