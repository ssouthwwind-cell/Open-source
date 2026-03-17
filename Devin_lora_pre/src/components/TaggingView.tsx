import React, { useState, useCallback } from 'react';
import { ImageItem } from '../types';
import { analyzeImage } from '../services/geminiService';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface TaggingViewProps {
  images: ImageItem[];
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  onClose: () => void;
  onNext: () => void;
}

export function TaggingView({ images, onUpdateImage, onClose, onNext }: TaggingViewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleBatchAnalyze = async () => {
    // Provide a default config since this component isn't currently used but needs to compile
    const defaultConfig = {
      provider: 'custom',
      baseUrl: 'https://api2.qiandao.mom/v1',
      apiKey: '',
      model: 'gemini-3.1-pro-preview-h'
    };

    if (!defaultConfig.apiKey) {
      setError('请先在设置中配置 API Key');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    let completed = 0;
    for (const img of images) {
      try {
        // Use cropped URL if available, otherwise original
        const urlToAnalyze = img.croppedUrl || img.originalUrl;
        const result = await analyzeImage(urlToAnalyze, defaultConfig);
        onUpdateImage(img.id, {
          tags: result.tags,
          caption: result.caption
        });
      } catch (e: any) {
        console.error(`Failed to analyze image ${img.id}:`, e);
        setError(`分析失败: ${e.message}`);
        break;
      }
      completed++;
      setProgress(Math.round((completed / images.length) * 100));
    }

    setIsAnalyzing(false);
  };

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
            <h2 className="text-xl font-bold text-gray-900">3. AI 自动打标</h2>
            <p className="text-sm text-gray-500">利用 Gemini 大模型自动生成标签和描述</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? `正在分析 (${progress}%)` : '开始批量分析'}</span>
          </button>
          
          <button
            onClick={onNext}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            <span>下一步：编辑标签</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="aspect-video relative bg-gray-100">
              <img 
                src={img.croppedUrl || img.originalUrl} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {img.tags && img.tags.length > 0 && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-white rounded-full" />
                </div>
              )}
            </div>
            
            <div className="p-4 flex-1 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">自然语言描述 (Caption)</label>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2 italic">
                  {img.caption || <span className="text-gray-300">等待分析...</span>}
                </p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">标签 (Tags)</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {img.tags && img.tags.length > 0 ? (
                    img.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-medium rounded-md border border-indigo-100">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-300">暂无标签</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
