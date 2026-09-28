// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // We now expect an array of messages, not just a 'code' string
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'No message history provided' }, { status: 400 });
    }

    const systemPrompt = `
      You are an expert software engineering mentor with a talent for breaking down complex topics. 
      The user is presenting code or asking follow-up questions.
      
      CRITICAL RULES: 
      1. Do not simply rewrite or optimize code for them. Your goal is to teach them how it works so they learn the underlying concepts.
      2. If it is their FIRST message with code, structure your response strictly using these Markdown headings: "### 📝 High-Level Summary", "### 🔍 Concept Breakdown", "### ⚠️ Edge Cases", and "### 🧠 Test Your Knowledge".
      3. For any subsequent follow-up questions, answer conversationally but keep the mentor persona. Always use Markdown for code snippets.
    `;

    // Construct the payload: System instructions first, followed by the entire conversation history
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await groq.chat.completions.create({
      messages: apiMessages,
      model: 'qwen/qwen3.8-27b',
      max_tokens: 800, // Keeps maximum generated response under the 1,000 OTPM limit
      });

    const responseText = response.choices[0]?.message?.content;

    return NextResponse.json({ result: responseText });
  } catch (error) {
    console.error('Error in Groq processing:', error);
    return NextResponse.json({ error: 'Failed to analyze code' }, { status: 500 });
  }
}