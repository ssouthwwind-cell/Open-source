import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ImageItem } from '../types';
import { ChevronLeft, Download, FileText, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface ExportViewProps {
  images: ImageItem[];
  onClose: () => void;
}

export function ExportView({ images, onClose }: ExportViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'tags' | 'caption' | 'both'>('both');
  const [isDone, setIsDone] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    
    const imageFolder = zip.folder("images");
    const textFolder = zip.folder("labels");

    for (const img of images) {
      const fileName = img.name || img.file.name;
      const baseName = fileName.split('.').slice(0, -1).join('.');
      
      // 1. Add Image (Convert to PNG)
      const imageUrl = img.croppedUrl || img.originalUrl;
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Convert to PNG using canvas
      const pngBlob = await new Promise<Blob>((resolve) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(image, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
            }, 'image/png');
          }
        };
        image.src = URL.createObjectURL(imageBlob);
      });

      imageFolder?.file(`${baseName}.png`, pngBlob);

      // 2. Add Tags (.txt)
      if ((exportFormat === 'tags' || exportFormat === 'both') && img.tags) {
        textFolder?.file(`${baseName}.txt`, img.tags.join(', '));
      }

      // 3. Add Caption (.caption)
      if ((exportFormat === 'caption' || exportFormat === 'both') && img.caption) {
        textFolder?.file(`${baseName}.caption`, img.caption);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "lora-dataset.zip");
    
    setIsExporting(false);
    setIsDone(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">5. 导出数据集</h2>
        <p className="text-gray-500">准备好您的 LoRA 训练数据，一键打包下载</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl text-center">
            <ImageIcon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">{images.length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">图片文件</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-center">
            <FileText className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {images.filter(i => i.tags && i.tags.length > 0).length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">已打标</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-center">
            <CheckCircle2 className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {images.filter(i => i.caption).length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">已写描述</div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-gray-900">导出格式选项</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'tags', label: '仅导出标签 (.txt)', desc: '用于关键词训练' },
              { id: 'caption', label: '仅导出描述 (.caption)', desc: '用于自然语言训练' },
              { id: 'both', label: '全部导出', desc: '包含标签和描述文件' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setExportFormat(opt.id as any)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  exportFormat === opt.id 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`text-sm font-bold ${exportFormat === opt.id ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {opt.label}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isDone ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>{isExporting ? '正在打包...' : isDone ? '导出成功！再次下载' : '生成并下载 ZIP 压缩包'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            返回上一步
          </button>
        </div>
      </div>

      {isDone && (
        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4 text-emerald-800">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold">数据集已准备就绪</div>
            <p className="text-sm opacity-80">您可以将解压后的文件直接放入 ComfyUI 或其他训练器的训练目录中。</p>
          </div>
        </div>
      )}
    </div>
  );
}
