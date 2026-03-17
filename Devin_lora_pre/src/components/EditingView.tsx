import React, { useState } from 'react';
import { ImageItem } from '../types';
import { ChevronLeft, ChevronRight, Save, Plus, X, Search, Edit3, Trash2 } from 'lucide-react';

interface EditingViewProps {
  images: ImageItem[];
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  onClose: () => void;
  onNext: () => void;
}

export function EditingView({ images, onUpdateImage, onClose, onNext }: EditingViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTag, setBatchTag] = useState('');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === images.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(images.map(img => img.id));
    }
  };

  const handleBatchAddTag = () => {
    if (!batchTag.trim()) return;
    const tagToAdd = batchTag.trim();
    
    selectedIds.forEach(id => {
      const img = images.find(i => i.id === id);
      if (img) {
        const currentTags = img.tags || [];
        if (!currentTags.includes(tagToAdd)) {
          onUpdateImage(id, { tags: [...currentTags, tagToAdd] });
        }
      }
    });
    setBatchTag('');
  };

  const handleBatchRemoveTag = (tagToRemove: string) => {
    selectedIds.forEach(id => {
      const img = images.find(i => i.id === id);
      if (img) {
        const currentTags = img.tags || [];
        onUpdateImage(id, { tags: currentTags.filter(t => t !== tagToRemove) });
      }
    });
  };

  // Get common tags among selected images
  const commonTags = selectedIds.length > 0 
    ? selectedIds.reduce((acc, id) => {
        const img = images.find(i => i.id === id);
        const tags = img?.tags || [];
        if (acc === null) return tags;
        return acc.filter(t => tags.includes(t));
      }, null as string[] | null) || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">4. 编辑标签 & 描述</h2>
            <p className="text-sm text-gray-500">手动调整 AI 生成的内容，支持批量操作</p>
          </div>
        </div>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
        >
          <span>下一步：导出数据</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Batch Operations Bar */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4 sticky top-16 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            {selectedIds.length === images.length ? '取消全选' : '全选图片'}
          </button>
          <span className="text-xs text-gray-500 font-medium">
            已选择 {selectedIds.length} 张
          </span>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            value={batchTag}
            onChange={(e) => setBatchTag(e.target.value)}
            placeholder="输入标签批量添加..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleBatchAddTag()}
          />
          <button
            onClick={handleBatchAddTag}
            disabled={selectedIds.length === 0 || !batchTag.trim()}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            批量添加
          </button>
        </div>

        {commonTags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">共同标签:</span>
            <div className="flex flex-wrap gap-1">
              {commonTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleBatchRemoveTag(tag)}
                  className="group flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="批量移除"
                >
                  {tag}
                  <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image List */}
      <div className="space-y-4">
        {images.map((img) => (
          <div 
            key={img.id} 
            className={`bg-white border rounded-2xl p-4 flex gap-6 transition-all ${
              selectedIds.includes(img.id) ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 shadow-sm'
            }`}
          >
            <div className="relative group shrink-0">
              <div 
                className={`w-32 h-32 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedIds.includes(img.id) ? 'border-indigo-500' : 'border-transparent'
                }`}
                onClick={() => toggleSelect(img.id)}
              >
                <img 
                  src={img.croppedUrl || img.originalUrl} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selectedIds.includes(img.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-white/80 border-gray-300'
              }`}>
                {selectedIds.includes(img.id) && <Plus className="w-3.5 h-3.5 text-white rotate-45" />}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3" />
                  自然语言描述 (Caption)
                </label>
                <textarea
                  value={img.caption || ''}
                  onChange={(e) => onUpdateImage(img.id, { caption: e.target.value })}
                  className="w-full h-24 p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  placeholder="输入图片描述..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3 h-3" />
                  标签 (Tags)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[96px] content-start">
                  {img.tags?.map((tag, i) => (
                    <span 
                      key={i} 
                      className="group flex items-center gap-1.5 px-2.5 py-1 bg-white text-indigo-600 text-xs font-medium rounded-lg border border-indigo-100 shadow-sm"
                    >
                      {tag}
                      <button 
                        onClick={() => onUpdateImage(img.id, { tags: img.tags?.filter(t => t !== tag) })}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="添加标签..."
                    className="bg-transparent border-none focus:outline-none text-xs text-gray-600 min-w-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !img.tags?.includes(val)) {
                          onUpdateImage(img.id, { tags: [...(img.tags || []), val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
