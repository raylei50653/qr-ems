import React, { useState } from 'react';
import type { Location } from '../../types';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MapPin, Plus, Edit, Trash2, QrCode } from 'lucide-react';

interface LocationTreeItemProps {
    location: Location;
    depth?: number;
    activeUuid?: string | null;
    onSelect: (loc: Location) => void;
    onEdit: (loc: Location) => void;
    onDelete: (uuid: string) => void;
    onAddChild: (parent: Location) => void;
    onShowQR: (loc: Location) => void;
}

export const LocationTreeItem: React.FC<LocationTreeItemProps> = ({
    location,
    depth = 0,
    activeUuid,
    onSelect,
    onEdit,
    onDelete,
    onAddChild,
    onShowQR
}) => {
    const [isOpen, setIsOpen] = useState(true); // Default open for better explorer feel
    const hasChildren = location.children && location.children.length > 0;
    const isActive = activeUuid === location.uuid;

    return (
        <div className="select-none">
            <div
                className={`
                    group flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all mb-0.5
                    ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-100 text-gray-700'}
                `}
                style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
                onClick={() => onSelect(location)}
            >
                {/* Expander Icon */}
                <div
                    className={`w-5 h-5 flex items-center justify-center transition-transform ${isOpen ? '' : '-rotate-90'}`}
                    onClick={(e) => {
                        if (hasChildren) {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }
                    }}
                >
                    {hasChildren ? (
                        <ChevronDown className={`w-3.5 h-3.5 ${isActive ? 'text-white/70' : 'text-gray-400'}`} />
                    ) : (
                        <div className="w-3.5 h-3.5" />
                    )}
                </div>

                {/* Type Icon */}
                <div className={`
                    w-7 h-7 flex items-center justify-center rounded-lg
                    ${isActive ? 'bg-white/20' : (hasChildren ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400')}
                `}>
                    {hasChildren ? (
                        <Folder className="w-4 h-4" />
                    ) : (
                        <MapPin className="w-4 h-4" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {location.name}
                    </div>
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-0.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onShowQR(location); }}
                        className={`p-1 rounded-md ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-indigo-600'}`}
                        title="顯示 QR Code"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddChild(location); }}
                        className={`p-1 rounded-md ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-green-600'}`}
                        title="新增子位置"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(location); }}
                        className={`p-1 rounded-md ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-blue-600'}`}
                        title="編輯"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(location.uuid); }}
                        className={`p-1 rounded-md ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-red-600'}`}
                        title="刪除"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Recursive Children */}
            {isOpen && hasChildren && (
                <div className="mt-0.5">
                    {location.children!.map((child) => (
                        <LocationTreeItem
                            key={child.uuid}
                            location={child}
                            depth={depth + 1}
                            activeUuid={activeUuid}
                            onSelect={onSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onShowQR={onShowQR}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
