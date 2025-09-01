import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get('message') || '';
  const userId = params.userId;

  if (!message) {
    return NextResponse.json({ reply: 'No message provided.' }, { status: 400 });
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // or gpt-4o/gpt-3.5-turbo depending on your tier
      messages: [
        { role: 'system', content: `You are an AI assistant helping user ${userId}.` },
        { role: 'user', content: message },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? 'No reply generated.';

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ reply: 'Error processing request.' }, { status: 500 });
  }
}
