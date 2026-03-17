import React, { useState } from 'react';
import { Crop, Settings2 } from 'lucide-react';
import { ImageItem } from '../types';

interface ProcessSidebarProps {
  images: ImageItem[];
  selectedIds: string[];
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  cropPreset?: { width: number; height: number; name: string } | null;
  onSelectPreset?: (preset: { width: number; height: number; name: string } | null) => void;
  onApplyCrop?: () => void;
  isCropping?: boolean;
  cropProgress?: number;
  language: 'zh' | 'en';
}

const CROP_PRESETS = [
  { category: 'SD', presets: [
    { width: 512, height: 512, name: '512 x 512' },
    { width: 512, height: 768, name: '512 x 768' },
    { width: 768, height: 512, name: '768 x 512' },
    { width: 1024, height: 1024, name: '1024 x 1024' },
    { width: 1024, height: 768, name: '1024 x 768' },
    { width: 768, height: 1024, name: '768 x 1024' },
  ]},
  { category: 'Flux', presets: [
    { width: 1024, height: 1024, name: '1024 x 1024' },
    { width: 1344, height: 768, name: '1344 x 768' },
    { width: 768, height: 1344, name: '768 x 1344' },
  ]},
  { category: 'Qwen', presets: [
    { width: 1328, height: 1328, name: '1328 x 1328' },
    { width: 1344, height: 1344, name: '1344 x 1344' },
  ]},
];

export function ProcessSidebar({ images, selectedIds, onUpdateImage, cropPreset, onSelectPreset, onApplyCrop, isCropping, cropProgress, language }: ProcessSidebarProps) {
  const [renamePrefix, setRenamePrefix] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  const t = language === 'zh' ? {
    resizeCrop: '调整大小 / 裁切',
    cropMode: '裁切模式',
    customSize: '自定义像素大小',
    width: '宽',
    height: '高',
    applyCrop: '应用裁切',
    rename: '重命名',
    renamePrefix: '文件名前缀',
    renamePlaceholder: '例如: image_',
    apply: '应用',
    applyAll: '应用到全部',
  } : {
    resizeCrop: 'Resize / Crop',
    cropMode: 'Crop Mode',
    customSize: 'Custom Pixel Size',
    width: 'Width',
    height: 'Height',
    applyCrop: 'Apply Crop',
    rename: 'Rename',
    renamePrefix: 'Filename Prefix',
    renamePlaceholder: 'e.g. image_',
    apply: 'Apply',
    applyAll: 'Apply to All',
  };

  const handleCustomCropChange = (width: string, height: string) => {
    setCustomWidth(width);
    setCustomHeight(height);
    
    const w = parseInt(width);
    const h = parseInt(height);
    
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      onSelectPreset?.({ width: w, height: h, name: 'Custom' });
    }
  };

  // Update inputs when preset changes externally (e.g. clicking a preset button)
  React.useEffect(() => {
    if (cropPreset) {
      setCustomWidth(cropPreset.width.toString());
      setCustomHeight(cropPreset.height.toString());
    }
  }, [cropPreset]);

  const handleRename = (scope: 'selected' | 'all') => {
    if (!renamePrefix.trim()) return;
    
    const targetImages = scope === 'selected' 
      ? images.filter(img => selectedIds.includes(img.id))
      : images;

    if (targetImages.length === 0 && scope === 'selected') return;

    targetImages.forEach((img, index) => {
      const newName = `${renamePrefix.trim()}_${index + 1}`;
      // Preserve extension
      const currentName = img.name || img.file.name;
      const lastDotIndex = currentName.lastIndexOf('.');
      const extension = lastDotIndex !== -1 ? currentName.slice(lastDotIndex) : '';
      
      onUpdateImage(img.id, { name: `${newName}${extension}` });
    });
    
    setRenamePrefix('');
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6 space-y-8 shadow-inner h-full">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-2">
          <Crop className="w-4 h-4" />
          <h3 className="text-sm uppercase tracking-wider">{t.resizeCrop}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">{t.cropMode}</label>
            
            {/* Custom Size Inputs */}
            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-gray-500">{t.customSize}</div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => handleCustomCropChange(e.target.value, customHeight)}
                    placeholder={t.width}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">W</span>
                </div>
                <span className="text-gray-300 font-bold">×</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => handleCustomCropChange(customWidth, e.target.value)}
                    placeholder={t.height}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">H</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {CROP_PRESETS.map((group) => (
                <div key={group.category} className="space-y-2">
                  <div className="text-xs font-bold text-gray-500">{group.category}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.presets.map((preset) => {
                      const isSelected = cropPreset?.width === preset.width && cropPreset?.height === preset.height;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => onSelectPreset?.(isSelected ? null : { ...preset, name: preset.name })}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {preset.width} × {preset.height}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={onApplyCrop}
            disabled={!cropPreset || selectedIds.length === 0 || isCropping}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
          >
            {isCropping ? (
              <div className="flex items-center gap-3 w-full px-4">
                <div className="flex-1 h-1.5 bg-indigo-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300 ease-out" 
                    style={{ width: `${cropProgress}%` }} 
                  />
                </div>
                <span className="text-xs font-mono w-8 text-right">{cropProgress}%</span>
              </div>
            ) : (
              <>
                <Crop className="w-4 h-4" />
                <span>{t.applyCrop} ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-2">
          <Settings2 className="w-4 h-4" />
          <h3 className="text-sm uppercase tracking-wider">{t.rename}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">{t.renamePrefix}</label>
            <input 
              type="text" 
              value={renamePrefix}
              onChange={(e) => setRenamePrefix(e.target.value)}
              placeholder={t.renamePlaceholder}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleRename('selected')}
              disabled={selectedIds.length === 0}
              className="flex-1 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.apply} ({selectedIds.length})
            </button>
            <button 
              onClick={() => handleRename('all')}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              {t.applyAll}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
