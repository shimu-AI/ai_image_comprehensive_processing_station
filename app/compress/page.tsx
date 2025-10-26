'use client';

import { useState, useRef } from 'react';

interface CompressedImage {
  original: File;
  compressed: string;
  originalSize: number;
  compressedSize: number;
  quality: number;
}

export default function CompressPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [compressedImage, setCompressedImage] = useState<CompressedImage | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [isProcessing, setIsProcessing] = useState(false);
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
      setCompressedImage(null);
    }
  };

  const compressImage = (file: File, quality: number): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
              resolve({ blob, dataUrl });
            }
          },
          'image/jpeg',
          quality / 100
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleCompress = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const { blob, dataUrl } = await compressImage(selectedImage, quality);

      setCompressedImage({
        original: selectedImage,
        compressed: dataUrl,
        originalSize: selectedImage.size,
        compressedSize: blob.size,
        quality
      });
    } catch (error) {
      console.error('压缩失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedImage) return;

    const link = document.createElement('a');
    link.href = compressedImage.compressed;
    link.download = `compressed_${compressedImage.original.name.replace(/\.[^/.]+$/, '.jpg')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCompressionRatio = (): string => {
    if (!compressedImage) return '0%';
    const ratio = ((compressedImage.originalSize - compressedImage.compressedSize) / compressedImage.originalSize) * 100;
    return ratio.toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              图片压缩
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              智能压缩图片大小，保持高质量的同时减少文件体积
            </p>
          </div>

          {/* 上传区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                    点击上传图片或拖拽图片到此处
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG、PNG、WebP 格式
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
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

          {/* 图片预览和压缩设置 */}
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

              {/* 压缩设置 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  压缩设置
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    压缩质量: {quality}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>高压缩</span>
                    <span>高质量</span>
                  </div>
                </div>

                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  {isProcessing ? '压缩中...' : '开始压缩'}
                </button>
              </div>
            </div>
          )}

          {/* 压缩结果 */}
          {compressedImage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                压缩结果
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    压缩后预览
                  </h4>
                  <img
                    src={compressedImage.compressed}
                    alt="Compressed"
                    className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                    压缩信息
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">原始大小:</span>
                      <span className="font-medium">{formatFileSize(compressedImage.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">压缩后大小:</span>
                      <span className="font-medium">{formatFileSize(compressedImage.compressedSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">压缩率:</span>
                      <span className="font-medium text-green-600">{getCompressionRatio()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">质量:</span>
                      <span className="font-medium">{compressedImage.quality}%</span>
                    </div>
                  </div>

                  <button
                    onClick={downloadCompressed}
                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    下载压缩图片
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