import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ImageItem, ModelConfig } from '../types';
import { analyzeImage } from '../services/geminiService';
import { 
  X, 
  CheckSquare, 
  Sparkles, 
  Plus, 
  ChevronDown, 
  Loader2
} from 'lucide-react';

interface ImagePreviewViewProps {
  images: ImageItem[];
  activeId: string | null;
  onSetActiveId: (id: string) => void;
  onClose: () => void;
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  activeTab: 'process' | 'tagging';
  onTabChange: (tab: 'process' | 'tagging') => void;
  sidebar?: React.ReactNode;
  cropPreset?: { width: number; height: number; name: string } | null;
  language: 'zh' | 'en';
  config: ModelConfig;
}

export function ImagePreviewView({ 
  images, 
  activeId, 
  onSetActiveId, 
  onClose, 
  onUpdateImage,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  activeTab,
  onTabChange,
  sidebar,
  cropPreset,
  language,
  config
}: ImagePreviewViewProps) {
  const activeImage = useMemo(() => images.find(img => img.id === activeId), [images, activeId]);
  const [newTag, setNewTag] = useState('');
  const [batchTag, setBatchTag] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [tagLanguage, setTagLanguage] = useState<'zh' | 'en'>('zh');
  const [tagType, setTagType] = useState<'tags' | 'caption'>('tags');
  const [error, setError] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; startCropX: number; startCropY: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  if (!activeImage) return null;

  const t = language === 'zh' ? {
    appName: '图像处理器',
    process: '处理与重命名',
    tagging: '打标',
    backHome: '返回主页',
    images: '图片',
    deselectAll: '取消全选',
    selectAll: '全选',
    tagsCount: '个标签',
    singleTagging: '单图打标',
    configureApiKey: '请先在右上角设置中配置 API Key',
    analyzeFailed: '图片分析失败',
    unknownError: '未知错误',
    generateSingle: '生成单张',
    tagMode: '单个标签',
    captionMode: '自然语言',
    generateAll: '生成所有图片的标签',
    stopping: '正在停止...',
    stop: '停止',
    addTagPlaceholder: '添加标签...',
    addToCurrent: '添加至当前图片',
    addToAll: '添加至所有图片',
    caption: '自然语言描述',
    currentTags: '当前标签',
    noTags: '暂无标签',
    removeTag: '移除标签',
    removeTagPlaceholder: '输入要删除的标签',
    applyAll: '应用到全部',
    dragCropHint: '拖动白框调整裁切区域',
  } : {
    appName: 'Image Processor',
    process: 'Process & Rename',
    tagging: 'Tagging',
    backHome: 'Back to Home',
    images: 'Images',
    deselectAll: 'Deselect All',
    selectAll: 'Select All',
    tagsCount: 'tags',
    singleTagging: 'Single Image Tagging',
    configureApiKey: 'Please configure your API key in the top-right settings first',
    analyzeFailed: 'Image analysis failed',
    unknownError: 'Unknown error',
    generateSingle: 'Generate Current',
    tagMode: 'Tags',
    captionMode: 'Caption',
    generateAll: 'Generate Tags for All Images',
    stopping: 'Stopping...',
    stop: 'Stop',
    addTagPlaceholder: 'Add tag...',
    addToCurrent: 'Add to current image',
    addToAll: 'Add to all images',
    caption: 'Caption',
    currentTags: 'Current Tags',
    noTags: 'No tags yet',
    removeTag: 'Remove Tag',
    removeTagPlaceholder: 'Enter tag to remove',
    applyAll: 'Apply to All',
    dragCropHint: 'Drag the white frame to adjust crop area',
  };

  useEffect(() => {
    const updateSize = () => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [activeImage.id, cropPreset]);

  const imageAspect = (activeImage.width || 1) / (activeImage.height || 1);
  const containerAspect = containerSize.width > 0 && containerSize.height > 0 ? containerSize.width / containerSize.height : imageAspect;
  const renderedImageSize = containerSize.width > 0 && containerSize.height > 0
    ? imageAspect > containerAspect
      ? { width: containerSize.width, height: containerSize.width / imageAspect }
      : { width: containerSize.height * imageAspect, height: containerSize.height }
    : { width: 0, height: 0 };
  const cropAspect = cropPreset ? cropPreset.width / cropPreset.height : 1;
  const overlaySize = cropPreset && renderedImageSize.width > 0 && renderedImageSize.height > 0
    ? cropAspect > imageAspect
      ? { width: renderedImageSize.width, height: renderedImageSize.width / cropAspect }
      : { width: renderedImageSize.height * cropAspect, height: renderedImageSize.height }
    : { width: 0, height: 0 };
  const maxOffsetX = Math.max(0, renderedImageSize.width - overlaySize.width);
  const maxOffsetY = Math.max(0, renderedImageSize.height - overlaySize.height);
  const cropPosition = activeImage.cropPosition || { x: 0.5, y: 0.5 };
  const overlayLeft = cropPreset ? -maxOffsetX / 2 + maxOffsetX * cropPosition.x : 0;
  const overlayTop = cropPreset ? -maxOffsetY / 2 + maxOffsetY * cropPosition.y : 0;

  const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropPreset) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startCropX: cropPosition.x,
      startCropY: cropPosition.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleOverlayPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropPreset || !dragStateRef.current) return;
    event.preventDefault();
    const nextX = maxOffsetX === 0
      ? dragStateRef.current.startCropX
      : dragStateRef.current.startCropX + (event.clientX - dragStateRef.current.startX) / maxOffsetX;
    const nextY = maxOffsetY === 0
      ? dragStateRef.current.startCropY
      : dragStateRef.current.startCropY + (event.clientY - dragStateRef.current.startY) / maxOffsetY;

    onUpdateImage(activeImage.id, {
      cropPosition: {
        x: Math.min(1, Math.max(0, nextX)),
        y: Math.min(1, Math.max(0, nextY)),
      }
    });
  };

  const handleOverlayPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tags = activeImage.tags || [];
    if (!tags.includes(newTag.trim())) {
      onUpdateImage(activeImage.id, { tags: [...tags, newTag.trim()] });
    }
    setNewTag('');
  };

  const handleAddTagToAll = () => {
    if (!newTag.trim()) return;
    const tagToAdd = newTag.trim();
    images.forEach(img => {
      const tags = img.tags || [];
      if (!tags.includes(tagToAdd)) {
        onUpdateImage(img.id, { tags: [...tags, tagToAdd] });
      }
    });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tags = activeImage.tags || [];
    onUpdateImage(activeImage.id, { tags: tags.filter(t => t !== tagToRemove) });
  };

  const handleBatchAddTag = () => {
    if (!batchTag.trim() || selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      const img = images.find(i => i.id === id);
      if (img) {
        const tags = img.tags || [];
        if (!tags.includes(batchTag.trim())) {
          onUpdateImage(id, { tags: [...tags, batchTag.trim()] });
        }
      }
    });
    setBatchTag('');
  };

  const analyzeImages = async (targetIds: string[]) => {
    if (targetIds.length === 0) return;
    
    if (!config.apiKey) {
      setError(t.configureApiKey);
      return;
    }
    
    setError(null);
    setIsAnalyzing(true);
    setStopRequested(false);
    
    for (const id of targetIds) {
      // Check if stop was requested
      if (window.stopBatchTagging) {
        window.stopBatchTagging = false;
        break;
      }

      try {
        const img = images.find(i => i.id === id);
        if (!img) continue;
        const url = img.croppedUrl || img.originalUrl;
        const result = await analyzeImage(url, config, tagLanguage, tagType === 'caption' ? 'caption' : 'tags');
        
        const updates: Partial<ImageItem> = {};
        if (tagType === 'tags') {
          updates.tags = result.tags;
        } else {
          updates.caption = result.caption;
        }
        onUpdateImage(id, updates);
      } catch (err: any) {
        console.error(`Failed to analyze image ${id}:`, err);
        setError(`${t.analyzeFailed}: ${err.message || t.unknownError}`);
        break; // Stop on error
      }
    }
    
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="font-bold text-gray-800">{t.appName}</h1>
          </div>
          <nav className="flex items-center bg-gray-100 p-1 rounded-xl ml-4">
            <button 
              onClick={() => {
                onTabChange('process');
                onClose();
              }}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'process' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.process}
            </button>
            <button 
              onClick={() => onTabChange('tagging')}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tagging' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.tagging}
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <span>{t.backHome}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Image List */}
        <aside className="w-64 border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.images} ({images.length})</span>
            <button 
              onClick={onSelectAll}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              {selectedIds.length === images.length && images.length > 0 ? t.deselectAll : t.selectAll}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {images.map(img => (
              <div 
                key={img.id}
                onClick={() => onSetActiveId(img.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-4 ${
                  activeId === img.id ? 'bg-indigo-50 border-indigo-500' : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(img.id);
                  }}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    selectedIds.includes(img.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  {selectedIds.includes(img.id) && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <img src={img.croppedUrl || img.originalUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{img.name || img.file.name}</p>
                  <p className="text-[10px] text-gray-400">{img.tags?.length || 0} {t.tagsCount}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Large Preview */}
        <main className="flex-1 bg-gray-50 flex items-center justify-center p-8 overflow-hidden">
          <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <div 
              ref={imageContainerRef}
              className="relative"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 160px)',
                aspectRatio: activeImage.width && activeImage.height ? `${activeImage.width} / ${activeImage.height}` : 'auto'
              }}
            >
              <img 
                src={activeImage.croppedUrl || activeImage.originalUrl} 
                className="w-full h-full object-contain block"
                referrerPolicy="no-referrer"
              />
              
              {/* Crop Overlay */}
              {cropPreset && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="border-2 border-white/80 bg-black/20 shadow-2xl backdrop-blur-[1px] cursor-move touch-none"
                    onPointerDown={handleOverlayPointerDown}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                    onPointerCancel={handleOverlayPointerUp}
                    style={{
                      aspectRatio: `${cropPreset.width} / ${cropPreset.height}`,
                      width: overlaySize.width || undefined,
                      height: overlaySize.height || undefined,
                      transform: `translate(${overlayLeft}px, ${overlayTop}px)`
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full border border-black/30 opacity-50"></div>
                    <div className="absolute left-1/2 top-2 -translate-x-1/2 text-white/90 text-[10px] font-bold bg-black/50 px-2 py-1 rounded whitespace-nowrap">
                      {t.dragCropHint}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 text-xs font-bold bg-black/50 px-2 py-1 rounded">
                      {cropPreset.width}x{cropPreset.height}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        {sidebar ? sidebar : (
        <aside className="w-80 border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Single Image Tagging */}
          <section className="p-6 space-y-6 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-2">
              <h3 className="text-xs uppercase tracking-wider">{t.singleTagging}</h3>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-800 truncate">{activeImage.file.name}</p>
              <p className="text-xs text-gray-400">{(activeImage.file.size / 1024).toFixed(1)} KB</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => analyzeImages([activeImage.id])}
                  disabled={isAnalyzing}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{t.generateSingle}</span>
                </button>
                <div 
                  onClick={() => setTagLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
                  className="flex items-center gap-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 cursor-pointer hover:bg-gray-100"
                >
                  <span>{tagLanguage === 'zh' ? '中' : 'EN'}</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <div className="relative group">
                  <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 cursor-pointer hover:bg-gray-100">
                    <span>{tagType === 'tags' ? t.tagMode : t.captionMode}</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    <button 
                      onClick={() => setTagType('tags')}
                      className={`w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-gray-50 rounded-t-xl ${tagType === 'tags' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                    >
                      {t.tagMode}
                    </button>
                    <button 
                      onClick={() => setTagType('caption')}
                      className={`w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-gray-50 rounded-b-xl ${tagType === 'caption' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                    >
                      {t.captionMode}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => analyzeImages(images.map(i => i.id))}
                  disabled={isAnalyzing}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {t.generateAll}
                </button>
                {isAnalyzing && (
                  <button 
                    onClick={() => {
                      window.stopBatchTagging = true;
                      setStopRequested(true);
                    }}
                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    {stopRequested ? t.stopping : t.stop}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder={t.addTagPlaceholder}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button onClick={handleAddTag} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200" title={t.addToCurrent}>
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={handleAddTagToAll} className="p-2 bg-indigo-100 rounded-xl hover:bg-indigo-200" title={t.addToAll}>
                  <Plus className="w-4 h-4 text-indigo-600" />
                </button>
              </div>

              {activeImage.caption && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.caption}</label>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 italic">
                    {activeImage.caption}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.currentTags} ({activeImage.tags?.length || 0})</label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeImage.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {(!activeImage.tags || activeImage.tags.length === 0) && (
                    <span className="text-[10px] text-gray-300 italic">{t.noTags}</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Tag Removal Section */}
          <section className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.removeTag}</label>
                <input 
                  type="text" 
                  value={batchTag}
                  onChange={(e) => setBatchTag(e.target.value)}
                  placeholder={t.removeTagPlaceholder}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!batchTag.trim()) return;
                    const tagToRemove = batchTag.trim();
                    images.forEach(img => {
                      const tags = img.tags || [];
                      if (tags.includes(tagToRemove)) {
                        onUpdateImage(img.id, { tags: tags.filter(t => t !== tagToRemove) });
                      }
                    });
                    setBatchTag('');
                  }}
                  className="w-full py-2 bg-white border border-gray-300 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-50"
                >
                  {t.applyAll}
                </button>
              </div>
            </div>
          </section>
        </aside>
        )}
      </div>
    </div>
  );
}
