'use client';

import { useState } from 'react';

interface GeneratedImage {
  url: string;
  prompt: string;
  size: string;
  timestamp: Date;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState<string>('');
  const [size, setSize] = useState<string>('2K');
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入图片描述');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          size
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成失败，请稍后重试');
      }

      const data = await response.json();

      if (data.data && data.data[0] && data.data[0].url) {
        setGeneratedImage({
          url: data.data[0].url,
          prompt,
          size,
          timestamp: new Date()
        });
      } else {
        throw new Error('API返回格式异常');
      }

    } catch (error) {
      console.error('生成失败:', error);
      setError(error instanceof Error ? error.message : '生成失败，请检查网络连接或稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      setError('下载失败，请稍后重试');
    }
  };

  const promptTemplates = [
    {
      category: '风景类',
      templates: [
        '美丽的自然风景，山川河流，蓝天白云，油画风格，高分辨率',
        '夕阳西下的海滩，金色光线，浪漫氛围，摄影级画质',
        '神秘的森林，阳光透过树叶，魔幻氛围，数字艺术'
      ]
    },
    {
      category: '人物类',
      templates: [
        '美丽的女孩，长发飘逸，温柔笑容，动漫风格，高品质',
        '英俊的男性，现代服装，自信表情，写实风格',
        '可爱的小孩，天真笑容，温暖色调，儿童插画风格'
      ]
    },
    {
      category: '科幻类',
      templates: [
        '未来城市，科技感建筑，霓虹灯光，赛博朋克风格',
        '宇宙星空，星际飞船，神秘星球，科幻电影质感',
        '机器人，人工智能，未来科技，金属质感，3D渲染'
      ]
    },
    {
      category: '艺术类',
      templates: [
        '抽象艺术，色彩丰富，几何图形，现代艺术风格',
        '水彩画风格，柔和色调，梦幻效果，艺术插画',
        '油画风格，厚重笔触，经典艺术，大师级作品'
      ]
    }
  ];

  const sizeOptions = [
    { value: '1K', label: '1K (1024×1024)' },
    { value: '2K', label: '2K (2048×2048)' },
    { value: '4K', label: '4K (4096×4096)' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              AI生图
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              基于文本描述生成高质量图片，释放创意无限可能
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：输入区域 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 提示词输入 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  描述你想要的图片
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      图片描述 (提示词)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="例如：美丽的自然风景，山川河流，蓝天白云，油画风格，高分辨率..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      详细描述能帮助AI生成更符合期望的图片
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      图片尺寸
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {sizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI生成中...
                      </div>
                    ) : (
                      '生成图片'
                    )}
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* 生成结果 */}
              {generatedImage && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    生成结果
                  </h3>

                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={generatedImage.url}
                        alt="Generated"
                        className="w-full rounded-lg shadow-md"
                        onLoad={() => setError('')}
                        onError={() => setError('图片加载失败')}
                      />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">生成信息</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div><span className="font-medium">提示词:</span> {generatedImage.prompt}</div>
                        <div><span className="font-medium">尺寸:</span> {generatedImage.size}</div>
                        <div><span className="font-medium">生成时间:</span> {generatedImage.timestamp.toLocaleString()}</div>
                      </div>
                    </div>

                    <button
                      onClick={downloadImage}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      下载图片
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：提示词模板 */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  提示词模板
                </h3>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {promptTemplates.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">
                        {category.category}
                      </h4>
                      <div className="space-y-2">
                        {category.templates.map((template, templateIndex) => (
                          <button
                            key={templateIndex}
                            onClick={() => setPrompt(template)}
                            className="w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-orange-50 dark:hover:bg-orange-900/20 p-3 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">💡 提示词技巧</h4>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  <li>• 描述越详细，生成效果越好</li>
                  <li>• 可以指定艺术风格和画质</li>
                  <li>• 添加色彩、光线、构图等描述</li>
                  <li>• 使用"高分辨率"、"精美细节"等关键词</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}