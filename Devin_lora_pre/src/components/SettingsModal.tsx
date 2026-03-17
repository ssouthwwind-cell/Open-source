import React, { useState, useEffect } from 'react';
import { ModelConfig } from '../types';
import { X } from 'lucide-react';

const API_PRESETS = {
  custom: {
    provider: 'custom',
    baseUrl: '',
    model: '',
  },
  qwen_compatible: {
    provider: 'qwen_compatible',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  doubao_compatible: {
    provider: 'doubao_compatible',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-1.5-pro-32k-250115',
  },
  siliconflow_compatible: {
    provider: 'siliconflow_compatible',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-VL-72B-Instruct',
  },
  moonshot_compatible: {
    provider: 'moonshot_compatible',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
  },
} as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: ModelConfig;
  onSave: (config: ModelConfig) => void;
  language: 'zh' | 'en';
}

export function SettingsModal({ isOpen, onClose, config, onSave, language }: Props) {
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config);

  const t = language === 'zh' ? {
    title: 'API 设置',
    preset: '接口预设',
    baseUrl: '接口地址 (Base URL)',
    apiKey: '密钥 (API Key)',
    model: '模型名称 (Model)',
    custom: '自定义',
    qwenCompatible: '阿里千问（兼容模式）',
    doubaoCompatible: '豆包 Ark（兼容模式）',
    siliconflowCompatible: 'SiliconFlow',
    moonshotCompatible: 'Moonshot / Kimi',
    persistTip: 'API Key 会保存在当前浏览器的本地存储中，仅保存在你的本机浏览器里，不会自动写入代码仓库。',
    presetTip: '优先选择兼容 OpenAI Chat Completions 的接口；如果你的平台给的是原生 SDK/原生接口，请改用“自定义”并确认接口格式兼容。',
    cancel: '取消',
    save: '保存',
  } : {
    title: 'API Settings',
    preset: 'API Preset',
    baseUrl: 'Base URL',
    apiKey: 'API Key',
    model: 'Model',
    custom: 'Custom',
    qwenCompatible: 'Qwen (Compatible Mode)',
    doubaoCompatible: 'Doubao Ark (Compatible Mode)',
    siliconflowCompatible: 'SiliconFlow',
    moonshotCompatible: 'Moonshot / Kimi',
    persistTip: 'Your API key is stored in this browser\'s local storage only. It is not automatically written into your code repository.',
    presetTip: 'Prefer OpenAI Chat Completions compatible endpoints. If your platform provides a native SDK or non-compatible API, use Custom and verify request compatibility.',
    cancel: 'Cancel',
    save: 'Save',
  };

  const presetOptions = [
    { value: 'custom', label: t.custom },
    { value: 'qwen_compatible', label: t.qwenCompatible },
    { value: 'doubao_compatible', label: t.doubaoCompatible },
    { value: 'siliconflow_compatible', label: t.siliconflowCompatible },
    { value: 'moonshot_compatible', label: t.moonshotCompatible },
  ];

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  const handlePresetChange = (presetKey: string) => {
    const preset = API_PRESETS[presetKey as keyof typeof API_PRESETS] || API_PRESETS.custom;
    setLocalConfig(prev => ({
      ...prev,
      provider: preset.provider,
      baseUrl: preset.baseUrl || prev.baseUrl,
      model: preset.model || prev.model,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{t.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.preset}</label>
            <select
              value={localConfig.provider}
              onChange={e => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              {presetOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500 leading-5">{t.presetTip}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.baseUrl}</label>
            <input 
              type="text" 
              value={localConfig.baseUrl} 
              onChange={e => setLocalConfig({...localConfig, baseUrl: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              placeholder="https://api.openai.com/v1" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.apiKey}</label>
            <input 
              type="password" 
              value={localConfig.apiKey} 
              onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              placeholder="sk-..." 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.model}</label>
            <input 
              type="text" 
              value={localConfig.model} 
              onChange={e => setLocalConfig({...localConfig, model: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              placeholder="gpt-4o-mini" 
            />
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-5">
            {t.persistTip}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={() => { onSave(localConfig); onClose(); }} 
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-100"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
