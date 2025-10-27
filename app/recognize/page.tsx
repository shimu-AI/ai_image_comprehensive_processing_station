'use client';

import { useState, useRef } from 'react';

interface RecognitionResult {
  original: File;
  analysis: string;
  question: string;
  timestamp: Date;
}

export default function RecognizePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [question, setQuestion] = useState<string>('请详细描述这张图片的内容，包括主要物体、场景、色彩、构图等信息。');
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
      setRecognitionResult(null);
      setError('');
    }
  };

  const getImageFormat = (file: File): string => {
    const mimeType = file.type;
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg';
    if (mimeType.includes('webp')) return 'webp';
    return 'jpeg'; // 默认
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/...;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const recognizeImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError('');

    try {
      const imageFormat = getImageFormat(selectedImage);
      const imageData = await convertToBase64(selectedImage);

      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          imageFormat,
          question
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '识别失败，请稍后重试');
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        setRecognitionResult({
          original: selectedImage,
          analysis: data.choices[0].message.content,
          question,
          timestamp: new Date()
        });
      } else {
        throw new Error('API返回格式异常');
      }

    } catch (error) {
      console.error('识别失败:', error);
      setError(error instanceof Error ? error.message : '识别失败，请检查网络连接或稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const presetQuestions = [
    '请详细描述这张图片的内容，包括主要物体、场景、色彩、构图等信息。',
    '这张图片的主要内容是什么？',
    '图片中有哪些人物或动物？',
    '请分析图片的风格和色调。',
    '图片中的文字内容是什么？',
    '这张图片拍摄的地点可能在哪里？',
    '图片表达了什么情感或氛围？'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              图片识别
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              AI图像识别技术，智能分析图片内容、文字、物体等信息
            </p>
          </div>

          {/* 上传区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                    点击上传图片或拖拽图片到此处
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG、PNG、WebP 格式，AI将智能分析图片内容
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
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

          {/* 图片预览和识别设置 */}
          {selectedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 图片预览 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  图片预览
                </h3>
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-700 rounded-lg"
                  />
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    文件大小: {formatFileSize(selectedImage.size)}
                  </div>
                </div>
              </div>

              {/* 识别设置 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  识别设置
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      识别问题
                    </label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="输入你想了解的问题..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      预设问题
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {presetQuestions.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => setQuestion(preset)}
                          className="text-left text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2 rounded transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={recognizeImage}
                    disabled={isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI分析中...
                      </div>
                    ) : (
                      '开始识别'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 识别结果 */}
          {recognitionResult && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                识别结果
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    识别问题
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                    {recognitionResult.question}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI分析结果
                  </h4>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {recognitionResult.analysis}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <span>识别时间: {recognitionResult.timestamp.toLocaleString()}</span>
                  <span>文件: {recognitionResult.original.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}