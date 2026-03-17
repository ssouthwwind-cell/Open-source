import React, { useState, useCallback } from 'react';
import { ImageGallery } from './components/ImageGallery';
import { CropperView } from './components/CropperView';
import { EditingView } from './components/EditingView';
import { ExportView } from './components/ExportView';
import { ImagePreviewView } from './components/ImagePreviewView';
import { ProcessSidebar } from './components/ProcessSidebar';
import { SettingsModal } from './components/SettingsModal';
import { ImageItem, ModelConfig } from './types';
import { Layers, Crop, Tags, Download, Settings2, Upload, FileJson, CheckSquare, Square, Settings, Languages } from 'lucide-react';

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'qwen_compatible',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: '', // 请在页面右上角的设置中填写您的 API Key
  model: 'qwen-plus'
};

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'process' | 'tagging'>('process');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [viewMode, setViewMode] = useState<'gallery' | 'preview'>('gallery');
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [cropPreset, setCropPreset] = useState<{ width: number; height: number; name: string } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropProgress, setCropProgress] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<ModelConfig>(() => {
    const saved = localStorage.getItem('app_model_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const handleSaveConfig = (newConfig: ModelConfig) => {
    setConfig(newConfig);
    localStorage.setItem('app_model_config', JSON.stringify(newConfig));
  };

  const handleUpload = useCallback(async (files: File[]) => {
    const newImages: ImageItem[] = [];
    
    for (const file of files) {
      const url = URL.createObjectURL(file);
      
      // Load image to get dimensions
      const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          resolve({ width: 0, height: 0 });
        };
        img.src = url;
      });

      newImages.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        originalUrl: url,
        width: dimensions.width,
        height: dimensions.height
      });
    }
    
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.length === images.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(images.map(img => img.id));
    }
  }, [selectedIds.length, images]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleSelectPreset = useCallback((preset: { width: number; height: number; name: string } | null) => {
    setCropPreset(preset);
    if (preset && selectedIds.length === 0 && images.length > 0) {
      setSelectedIds(images.map(img => img.id));
    }
  }, [selectedIds.length, images]);

  const handleImageDoubleClick = useCallback((id: string) => {
    setPreviewImageId(id);
    setViewMode('preview');
  }, []);

  const handleClosePreview = useCallback(() => {
    setViewMode('gallery');
    setPreviewImageId(null);
    setActiveTab('process');
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.originalUrl);
        if (removed.croppedUrl) URL.revokeObjectURL(removed.croppedUrl);
      }
      return filtered;
    });
  }, []);

  const handleUpdateImage = useCallback((id: string, updates: Partial<ImageItem>) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        // If updating croppedUrl, revoke the old one
        if (updates.croppedUrl && img.croppedUrl && updates.croppedUrl !== img.croppedUrl) {
          URL.revokeObjectURL(img.croppedUrl);
        }
        return { ...img, ...updates };
      }
      return img;
    }));
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!cropPreset || selectedIds.length === 0) return;

    setIsCropping(true);
    setCropProgress(0);
    const targetImages = images.filter(img => selectedIds.includes(img.id));
    let completed = 0;
    
    for (const img of targetImages) {
      await new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = cropPreset.width;
          canvas.height = cropPreset.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const imageWidth = image.width;
            const imageHeight = image.height;
            const targetAspect = cropPreset.width / cropPreset.height;
            const imageAspect = imageWidth / imageHeight;

            let sourceWidth = imageWidth;
            let sourceHeight = imageHeight;

            if (targetAspect > imageAspect) {
              sourceHeight = imageWidth / targetAspect;
            } else {
              sourceWidth = imageHeight * targetAspect;
            }

            const maxOffsetX = Math.max(0, imageWidth - sourceWidth);
            const maxOffsetY = Math.max(0, imageHeight - sourceHeight);
            const cropPosition = img.cropPosition || { x: 0.5, y: 0.5 };
            const sourceX = maxOffsetX * cropPosition.x;
            const sourceY = maxOffsetY * cropPosition.y;

            ctx.drawImage(
              image,
              sourceX, sourceY, sourceWidth, sourceHeight,
              0, 0, canvas.width, canvas.height
            );

            canvas.toBlob((blob) => {
              if (blob) {
                const croppedUrl = URL.createObjectURL(blob);
                handleUpdateImage(img.id, { croppedUrl, width: cropPreset.width, height: cropPreset.height });
              }
              resolve();
            }, 'image/png');
          } else {
            resolve();
          }
        };
        image.src = img.originalUrl;
      });
      
      completed++;
      setCropProgress(Math.round((completed / targetImages.length) * 100));
    }
    
    setIsCropping(false);
    setCropProgress(0);
  }, [cropPreset, selectedIds, images, handleUpdateImage]);

  const t = language === 'zh' ? {
    appName: '图像处理器',
    process: '处理与重命名',
    tagging: '打标',
    apiSettings: 'API 设置',
    uploadImages: '上传图片',
    exportZip: '导出 ZIP',
    emptyTitle: '开始准备您的数据集',
    emptyDesc: '点击右上角的“上传图片”按钮开始',
    galleryView: '图库视图',
    selectAll: '全选',
    selectedSuffix: '已选择',
    sortBy: '排序方式:',
    customOrder: '自定义排序',
    languageToggle: 'EN',
  } : {
    appName: 'Image Processor',
    process: 'Process & Rename',
    tagging: 'Tagging',
    apiSettings: 'API Settings',
    uploadImages: 'Upload Images',
    exportZip: 'Export ZIP',
    emptyTitle: 'Start preparing your dataset',
    emptyDesc: 'Click the “Upload Images” button in the top right to begin',
    galleryView: 'Gallery View',
    selectAll: 'Select All',
    selectedSuffix: 'selected',
    sortBy: 'Sort:',
    customOrder: 'Custom Order',
    languageToggle: '中',
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-gray-800">{t.appName}</h1>
            </div>

            <nav className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('process');
                  setViewMode('gallery');
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'process' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                <span>{t.process}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('tagging');
                  if (images.length > 0) {
                    setViewMode('preview');
                    setPreviewImageId(images[0].id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'tagging' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Tags className="w-4 h-4" />
                <span>{t.tagging}</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              title={language === 'zh' ? '切换到英文' : 'Switch to Chinese'}
            >
              <Languages className="w-4 h-4" />
              <span>{t.languageToggle}</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center w-9 h-9 bg-white border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              title={t.apiSettings}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('header-file-upload')?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>{t.uploadImages}</span>
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <FileJson className="w-4 h-4" />
              <span>{t.exportZip}</span>
            </button>
            <input
              id="header-file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleUpload(Array.from(e.target.files));
                }
              }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-200 rounded-3xl bg-white shadow-sm">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <Layers className="w-10 h-10 text-indigo-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t.emptyTitle}</h2>
                <p className="text-gray-500 mt-2 mb-8">{t.emptyDesc}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'process' && currentStep === 1 && viewMode === 'gallery' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-6">
                        <h2 className="text-lg font-bold text-gray-800">{t.galleryView}</h2>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={selectAll}
                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            {selectedIds.length === images.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            <span>{t.selectAll}</span>
                          </button>
                          <span className="text-sm text-gray-400 font-medium">{selectedIds.length} {t.selectedSuffix}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{t.sortBy}</span>
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">
                          <span>{t.customOrder}</span>
                        </div>
                      </div>
                    </div>
                    <ImageGallery 
                      images={images} 
                      onRemove={handleRemoveImage} 
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelect}
                      onDoubleClick={handleImageDoubleClick}
                      cropPreset={cropPreset}
                    />
                  </div>
                )}

                {viewMode === 'preview' && (
                  <ImagePreviewView
                    images={images}
                    activeId={previewImageId}
                    onSetActiveId={setPreviewImageId}
                    onClose={handleClosePreview}
                    onUpdateImage={handleUpdateImage}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onSelectAll={selectAll}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    cropPreset={cropPreset}
                    language={language}
                    config={config}
                    sidebar={activeTab === 'process' ? (
                      <ProcessSidebar 
                        images={images}
                        selectedIds={selectedIds}
                        onUpdateImage={handleUpdateImage}
                        cropPreset={cropPreset}
                        onSelectPreset={handleSelectPreset}
                        onApplyCrop={handleApplyCrop}
                        isCropping={isCropping}
                        cropProgress={cropProgress}
                        language={language}
                      />
                    ) : undefined}
                  />
                )}

                {activeTab === 'process' && currentStep === 2 && (
                  <CropperView 
                    images={images} 
                    onUpdateImage={handleUpdateImage} 
                    onClose={() => setCurrentStep(1)} 
                  />
                )}

                {currentStep === 4 && (
                  <EditingView 
                    images={images} 
                    onUpdateImage={handleUpdateImage} 
                    onClose={() => setActiveTab('tagging')} 
                    onNext={() => setCurrentStep(5)}
                  />
                )}

                {currentStep === 5 && (
                  <ExportView 
                    images={images} 
                    onClose={() => setCurrentStep(1)} 
                  />
                )}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        {images.length > 0 && activeTab === 'process' && currentStep === 1 && (
          <ProcessSidebar 
            images={images}
            selectedIds={selectedIds}
            onUpdateImage={handleUpdateImage}
            cropPreset={cropPreset}
            onSelectPreset={handleSelectPreset}
            onApplyCrop={handleApplyCrop}
            isCropping={isCropping}
            cropProgress={cropProgress}
            language={language}
          />
        )}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        language={language}
      />
    </div>
  );
}
