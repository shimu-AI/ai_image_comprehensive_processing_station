import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '2K' } = await request.json();

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json(
        { error: '请输入图片描述' },
        { status: 400 }
      );
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'ep-20251028211624-qm588',
        prompt: prompt.trim(),
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: size,
        stream: false,
        watermark: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API密钥无效或已过期' },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: '请求过于频繁，请稍后再试' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: '图片生成服务暂时不可用，请稍后重试' },
          { status: response.status }
        );
      }
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