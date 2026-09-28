// // app/api/analyze/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import Groq from 'groq-sdk';

// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// export async function POST(req: NextRequest) {
//   try {
//     const { code } = await req.json();

//     if (!code) {
//       return NextResponse.json({ error: 'No code provided' }, { status: 400 });
//     }

//     const systemPrompt = `
//       You are an expert software engineering mentor with a talent for breaking down complex topics. 
//       The user has pasted a code snippet for you to explain.
      
//       CRITICAL RULE: Do not simply rewrite or optimize the entire code for them. Your goal is to teach them how it works so they learn the underlying concepts.

//       Structure your response strictly using Markdown with the following sections:

//       ### 📝 High-Level Summary
//       Explain what the overall code achieves in simple, plain English. Use a brief real-world analogy if it helps make the concept click.

//       ### 🔍 Concept Breakdown
//       Break down the core logic block-by-block. For each important block:
//       * **Name the concept:** (e.g., "Asynchronous Fetching", "List Comprehension", "State Management")
//       * **Explain the mechanics:** Describe exactly what those specific lines are doing and *why* it is written that way. Use inline \`code snippets\` for variable names.

//       ### ⚠️ Edge Cases & Best Practices
//       Point out any potential bugs, security flaws, or edge cases the user should watch out for. If the code is already solid, briefly mention an industry best practice related to this specific architecture.

//       ### 🧠 Test Your Knowledge
//       End with exactly ONE thought-provoking question that requires the user to think critically about the logic they just submitted. Do not provide the answer.
//     `;

//     const response = await groq.chat.completions.create({
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: `Here is the code:\n\n${code}` }
//       ],
//       // Using the highly capable Qwen model for long context and coding
//       model: 'qwen/qwen3.8-27b',
//     });

//     const responseText = response.choices[0]?.message?.content;

//     return NextResponse.json({ result: responseText });
//   } catch (error) {
//     console.error('Error in Groq processing:', error);
//     return NextResponse.json({ error: 'Failed to analyze code' }, { status: 500 });
//   }
// }

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
    });

    const responseText = response.choices[0]?.message?.content;

    return NextResponse.json({ result: responseText });
  } catch (error) {
    console.error('Error in Groq processing:', error);
    return NextResponse.json({ error: 'Failed to analyze code' }, { status: 500 });
  }
}