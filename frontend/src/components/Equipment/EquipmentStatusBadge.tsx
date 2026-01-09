import React from 'react';

const STATUS_MAP: Record<string, string> = {
    AVAILABLE: '可借用',
    BORROWED: '已借出',
    PENDING_RETURN: '待歸還',
    MAINTENANCE: '維護中',
    TO_BE_MOVED: '需移動',
    IN_TRANSIT: '移動中',
    LOST: '遺失',
    DISPOSED: '已報廢',
};

const STATUS_STYLES: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    BORROWED: 'bg-blue-100 text-blue-800',
    PENDING_RETURN: 'bg-yellow-100 text-yellow-800',
    MAINTENANCE: 'bg-red-100 text-red-800',
    TO_BE_MOVED: 'bg-orange-100 text-orange-800',
    IN_TRANSIT: 'bg-amber-100 text-amber-800',
    LOST: 'bg-gray-200 text-gray-800',
    DISPOSED: 'bg-gray-100 text-gray-500',
};

interface EquipmentStatusBadgeProps {
    status: string;
    className?: string;
}

export const EquipmentStatusBadge: React.FC<EquipmentStatusBadgeProps> = ({ status, className = '' }) => {
    const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
    const label = STATUS_MAP[status] || status;

    return (
        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${style} ${className}`}>
            {label}
        </span>
    );
};
