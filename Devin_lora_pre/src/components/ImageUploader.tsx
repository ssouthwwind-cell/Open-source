import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = (Array.from(e.target.files) as File[]).filter(file => 
          file.type.startsWith('image/')
        );
        if (files.length > 0) {
          onUpload(files);
        }
      }
    },
    [onUpload]
  );

  return (
    <div
      className="w-full p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out flex flex-col items-center justify-center cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <UploadCloud className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        点击上传图片
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        支持 JPG, PNG, WebP 等常见图片格式，支持批量上传。
      </p>
    </div>
  );
}
