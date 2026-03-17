import React from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
import { ImageItem } from '../types';

interface ImageGalleryProps {
  images: ImageItem[];
  onRemove: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  cropPreset?: { width: number; height: number; name: string } | null;
}

export function ImageGallery({ images, onRemove, selectedIds, onToggleSelect, onDoubleClick, cropPreset }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6">
      {images.map((img) => {
        const isSelected = selectedIds.includes(img.id);
        const imgAR = (img.width && img.height) ? (img.width / img.height) : 1;
        
        return (
          <div 
            key={img.id} 
            className="flex flex-col gap-2 group"
            onDoubleClick={() => onDoubleClick(img.id)}
          >
            <div 
              className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center ${
                isSelected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-gray-100 hover:border-indigo-200'
              }`}
              onClick={() => onToggleSelect(img.id)}
            >
              <div 
                className="relative"
                style={{
                  width: imgAR >= 1 ? '100%' : 'auto',
                  height: imgAR < 1 ? '100%' : 'auto',
                  aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : 'auto'
                }}
              >
                <img 
                  src={img.croppedUrl || img.originalUrl} 
                  alt={img.file.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Crop Overlay */}
                {isSelected && cropPreset && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                      className="border-2 border-white/80 bg-black/20 shadow-2xl backdrop-blur-[1px]"
                      style={{
                        aspectRatio: `${cropPreset.width} / ${cropPreset.height}`,
                        width: (cropPreset.width / cropPreset.height) >= imgAR ? '100%' : 'auto',
                        height: (cropPreset.width / cropPreset.height) < imgAR ? '100%' : 'auto',
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-full border border-black/30 opacity-50"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 text-[10px] font-bold bg-black/50 px-1 rounded">
                        {cropPreset.width}x{cropPreset.height}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selection Indicator */}
              <div className={`absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all z-10 ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'
              }`}>
                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </div>

              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(img.id);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 rounded-lg shadow-sm transition-colors"
                  title="移除图片"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-1 text-center">
              <p className="text-[11px] font-bold text-gray-500 truncate leading-tight mb-1">
                {img.name || img.file.name}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                {(img.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
