import React from 'react';

interface LocationDisplayProps {
    location?: { full_path: string } | null;
    zone?: string;
    cabinet?: string;
    number?: string;
    isTarget?: boolean;
    placeholder?: React.ReactNode;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({ 
    location, zone, cabinet, number, 
    isTarget = false,
    placeholder = '-' 
}) => {
    // Check if any location data exists
    const hasData = location?.full_path || zone || cabinet || number;

    if (!hasData) {
        return <span className="text-[10px] font-black text-gray-300 italic">{placeholder}</span>;
    }

    const themeClass = isTarget ? 'text-orange-600' : 'text-gray-600';
    const badgeClass = isTarget 
        ? 'bg-orange-500 text-white' 
        : 'bg-green-600 text-white';

    return (
        <div className="space-y-1">
            {location?.full_path && (
                <div className={`text-[10px] font-black ${themeClass}`}>{location.full_path}</div>
            )}
            
            {(zone || cabinet || number) && (
                <div className="flex gap-1">
                    {zone && <span className={`${badgeClass} px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm`}>{zone}</span>}
                    {cabinet && <span className={`${badgeClass} px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm`}>{cabinet}</span>}
                    {number && <span className={`${badgeClass} px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm`}>{number}</span>}
                </div>
            )}
        </div>
    );
};
