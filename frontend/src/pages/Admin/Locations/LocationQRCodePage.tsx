import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLocations } from '../../../api/locations';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer, Search, MapPin, CheckCircle, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LOCATION_ZONES = ['A區', 'B區', 'C區', 'D區', 'E區', 'F區', '其他'];
const LOCATION_CABINETS = Array.from({ length: 10 }, (_, i) => `${i + 1}號櫃`).concat(['其他']);
const LOCATION_NUMBERS = Array.from({ length: 10 }, (_, i) => `${i + 1}號`).concat(['其他']);

export const LocationQRCodePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Spot Generator State
  const [genLoc, setGenLoc] = useState('');
  const [genZone, setGenZone] = useState('');
  const [genCabinet, setGenCabinet] = useState('');
  const [genNumber, setGenNumber] = useState('');

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });

  const handlePrint = () => {
    window.print();
  };

  // Filter existing locations
  const filteredLocations = locations?.filter(loc => 
    loc.name.toLowerCase().includes(search.toLowerCase()) || 
    loc.full_path.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (uuid: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(uuid)) {
      newSet.delete(uuid);
    } else {
      newSet.add(uuid);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (filteredLocations) {
      if (selectedIds.size === filteredLocations.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(filteredLocations.map(l => l.uuid)));
      }
    }
  };

  const isPrintFiltered = selectedIds.size > 0;
  const selectedLocObj = locations?.find(l => l.uuid === genLoc);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - No Print */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/locations')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6 text-gray-500" />
            </button>
            <div>
                <h1 className="text-xl font-black text-gray-800">位置 QR Code 生成器</h1>
                <p className="text-xs text-gray-400 font-bold mt-1">選取具體格位以產生對應的專屬標籤</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handlePrint}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
                <Printer className="w-4 h-4" /> 列印標籤
            </button>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Spot Generator Section */}
        <section className="print:hidden">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-primary" /> 快速生成具體格位標籤
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select 
                        className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        value={genLoc}
                        onChange={e => setGenLoc(e.target.value)}
                    >
                        <option value="">選擇倉庫...</option>
                        {locations?.map(loc => <option key={loc.uuid} value={loc.uuid}>{loc.full_path}</option>)}
                    </select>
                    <select 
                        className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        value={genZone}
                        onChange={e => setGenZone(e.target.value)}
                    >
                        <option value="">選擇區...</option>
                        {LOCATION_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <select 
                        className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        value={genCabinet}
                        onChange={e => setGenCabinet(e.target.value)}
                    >
                        <option value="">選擇櫃...</option>
                        {LOCATION_CABINETS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                        className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        value={genNumber}
                        onChange={e => setGenNumber(e.target.value)}
                    >
                        <option value="">選擇號...</option>
                        {LOCATION_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                {genLoc && (
                    <div className="mt-6 flex flex-col items-center p-8 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 animate-in fade-in zoom-in-95">
                        <div className="bg-white p-4 rounded-3xl shadow-xl mb-4">
                            <QRCodeSVG 
                                value={`location:${genLoc}${genZone ? `&zone=${genZone}` : ''}${genCabinet ? `&cabinet=${genCabinet}` : ''}${genNumber ? `&number=${genNumber}` : ''}`}
                                size={180}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-gray-800">{selectedLocObj?.name}</h3>
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                {genZone && <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-black">{genZone}</span>}
                                {genCabinet && <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-black">{genCabinet}</span>}
                                {genNumber && <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-black">{genNumber}</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-3 font-mono break-all max-w-xs">{genLoc}</p>
                        </div>
                        <button 
                            onClick={handlePrint}
                            className="mt-6 bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" /> 列印此標籤
                        </button>
                    </div>
                )}
            </div>
        </section>

        <div className="h-px bg-gray-200 print:hidden" />

        {/* Existing Locations Section */}
        <section>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> 現有倉庫列表
                </h2>
                <div className="flex items-center gap-3">
                    <div className="relative w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <input 
                            type="text" 
                            placeholder="快速過濾..." 
                            className="w-full pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleSelectAll}
                        className="text-xs font-black text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                    >
                        {selectedIds.size > 0 ? `已選 ${selectedIds.size} (點擊清空)` : '全選全部'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400 italic">載入中...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-2 print:gap-4">
                    {filteredLocations?.map(loc => {
                        const isSelected = selectedIds.has(loc.uuid);
                        const printClass = isPrintFiltered && !isSelected ? 'print:hidden' : '';
                        
                        return (
                            <div 
                                key={loc.uuid} 
                                onClick={() => toggleSelection(loc.uuid)}
                                className={`
                                    relative cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm transition-all break-inside-avoid 
                                    ${isSelected ? 'border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-100' : 'border-gray-100 bg-white hover:border-indigo-200'}
                                    ${printClass}
                                    print:border-black print:shadow-none print:ring-0 print:bg-white
                                `}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-indigo-600 print:hidden">
                                        <CheckCircle className="w-5 h-5 fill-indigo-100" />
                                    </div>
                                )}
                                
                                <div className="bg-white p-2 rounded-xl mb-3 shadow-sm border border-gray-100 print:border-none print:shadow-none">
                                    <QRCodeSVG 
                                        value={`location:${loc.uuid}`} 
                                        size={120}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1">{loc.name}</h3>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md print:bg-transparent print:text-black">
                                    {loc.full_path}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
      </main>
      
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white; }
          .print:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};
