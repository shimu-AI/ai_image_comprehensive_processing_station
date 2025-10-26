'use client';

import { useState, useRef } from 'react';

interface ProcessedImage {
  original: File;
  processed: string;
  originalSize: number;
  processedSize: number;
}

export default function RemoveBgPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setProcessedImage(null);
      setError('');
    }
  };

  const removeBackground = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image_file', selectedImage);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-API-Key': 'iTXKSkv8Vcs3Ms14KDDdpFuL',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.title || '处理失败，请稍后重试');
      }

      const blob = await response.blob();
      const dataUrl = URL.createObjectURL(blob);

      setProcessedImage({
        original: selectedImage,
        processed: dataUrl,
        originalSize: selectedImage.size,
        processedSize: blob.size,
      });
    } catch (error) {
      console.error('背景移除失败:', error);
      setError(error instanceof Error ? error.message : '处理失败，请检查网络连接或稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProcessed = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage.processed;
    link.download = `no-bg_${processedImage.original.name.replace(/\.[^/.]+$/, '.png')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              抠图去背景
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              AI智能识别主体，一键去除背景，支持透明背景输出
            </p>
          </div>

          {/* 上传区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {!selectedImage ? (
                <div>
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                    点击上传图片或拖拽图片到此处
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG、PNG、WebP 格式，建议上传清晰的人物或物体图片
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    选择图片
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    已选择: {selectedImage.name}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    重新选择
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* 图片预览和处理 */}
          {selectedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 原图预览 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  原图预览
                </h3>
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Original"
                    className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-700 rounded-lg"
                  />
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    文件大小: {formatFileSize(selectedImage.size)}
                  </div>
                </div>
              </div>

              {/* 处理控制 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  背景移除
                </h3>

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">处理说明</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• AI自动识别图片主体</li>
                      <li>• 智能去除背景</li>
                      <li>• 输出透明PNG格式</li>
                      <li>• 支持人物、动物、物品等</li>
                    </ul>
                  </div>

                  <button
                    onClick={removeBackground}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI处理中...
                      </div>
                    ) : (
                      '开始去除背景'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 处理结果 */}
          {processedImage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                处理结果
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    去背景后
                  </h4>
                  <div className="relative">
                    <img
                      src={processedImage.processed}
                      alt="Processed"
                      className="w-full h-64 object-contain rounded-lg"
                      style={{
                        background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      透明背景
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                    处理信息
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">原始大小:</span>
                      <span className="font-medium">{formatFileSize(processedImage.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">处理后大小:</span>
                      <span className="font-medium">{formatFileSize(processedImage.processedSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">输出格式:</span>
                      <span className="font-medium">PNG (透明)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">处理状态:</span>
                      <span className="font-medium text-green-600">✓ 完成</span>
                    </div>
                  </div>

                  <button
                    onClick={downloadProcessed}
                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    下载去背景图片
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}