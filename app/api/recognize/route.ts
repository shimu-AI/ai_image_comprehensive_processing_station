import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData, imageFormat, question } = await request.json();

    if (!imageData || !imageFormat) {
      return NextResponse.json(
        { error: '缺少图片数据或格式' },
        { status: 400 }
      );
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'ep-20251026220435-8jf9k',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: question || '请详细描述这张图片的内容，包括主要物体、场景、色彩、构图等信息。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${imageFormat};base64,${imageData}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      return NextResponse.json(
        { error: '图片识别服务暂时不可用，请稍后重试' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}