export interface ImageItem {
  id: string;
  file: File;
  name?: string; // Custom name for the image
  originalUrl: string;
  croppedUrl?: string;
  width?: number;
  height?: number;
  cropPosition?: {
    x: number;
    y: number;
  };
  tags?: string[];
  caption?: string;
}

declare global {
  interface Window {
    stopBatchTagging?: boolean;
  }
}

export interface ModelConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}
