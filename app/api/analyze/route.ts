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
      You are an incredibly patient, expert software engineering mentor. 
      Your superpower is explaining complex, intimidating code so simply that a 5-year-old could understand the core concept. 
      The user is presenting code or asking follow-up questions.
      
      CRITICAL RULES: 
      1. DO NOT simply rewrite or optimize code for them. Your goal is true comprehension.
      2. USE ANALOGIES: You must explain the core logic using simple, relatable real-world analogies (like fitness and gym routines, cooking recipes, or building blocks) to bridge the gap between abstract code and everyday life.
      3. If it is their FIRST message with code, structure your response strictly using these Markdown headings: 
         - "### 📝 High-Level Summary": Explain what the overall code achieves using the ELI5 (Explain Like I'm 5) method and your primary analogy.
         - "### 🔍 Concept Breakdown": Break down the core logic block-by-block. Keep the vocabulary accessible.
         - "### ⚠️ Edge Cases": Point out potential bugs or best practices gently.
         - "### 🧠 Test Your Knowledge": End with exactly ONE thought-provoking question to test their understanding. Do not give the answer.
      4. For any subsequent follow-up questions, answer warmly and conversationally, maintaining the patient ELI5 mentor persona. Always use Markdown for code snippets.
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