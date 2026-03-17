import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { ImageItem } from '../types';
import getCroppedImg from '../utils/cropImage';
import { Check, ChevronLeft, ChevronRight, Maximize, RotateCcw } from 'lucide-react';

interface CropperViewProps {
  images: ImageItem[];
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  onClose: () => void;
}

const PRESETS = [
  { label: '1:1', value: 1 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '自由', value: undefined },
];

export function CropperView({ images, onUpdateImage, onClose }: CropperViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const currentImage = images[currentIndex];

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!currentImage || !croppedAreaPixels) return;
    
    try {
      const croppedUrl = await getCroppedImg(currentImage.originalUrl, croppedAreaPixels);
      if (croppedUrl) {
        onUpdateImage(currentImage.id, { 
          croppedUrl, 
          width: croppedAreaPixels.width, 
          height: croppedAreaPixels.height 
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleBatchCrop = async () => {
    // Simple batch crop: center crop all images with current aspect ratio
    // This is a bit complex because we need to know image dimensions for each
    // For now, let's just implement a "Apply current aspect to all" or similar
    // Actually, let's just make it easy to navigate and save.
  };

  if (!currentImage) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
      {/* Top Toolbar */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-white font-medium">
            裁切图片 ({currentIndex + 1} / {images.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setAspect(preset.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                aspect === preset.value 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveCrop}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>保存当前</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 overflow-y-auto p-2 space-y-2 hidden md:block">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === idx ? 'border-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.croppedUrl || img.originalUrl} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Main Cropper Area */}
        <div className="flex-1 relative bg-black">
          <Cropper
            image={currentImage.originalUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32 accent-indigo-500"
          />
          <span className="text-xs text-gray-400">缩放: {zoom.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === images.length - 1}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCrop({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>
        </div>
      </div>
    </div>
  );
}
