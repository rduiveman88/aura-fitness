import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const code = fs.readFileSync('src/components/Workout.tsx', 'utf-8');
  
  // Extract baseFallbackLibrary array string
  const startIdx = code.indexOf('const baseFallbackLibrary = [');
  const endIdx = code.indexOf('];\n\nconst fallbackLibrary', startIdx);
  const arrayStr = code.substring(startIdx, endIdx + 2);
  
  console.log("Found array, length:", arrayStr.length);
  
  const prompt = `Here is a TypeScript array of exercise objects. 
For each exercise, add the following 3 fields if they are missing or generic:
1. "executionCue" (string): 2 sentences maximum on HOW to do it and WHERE to feel it.
2. "formGuide" (array of 3-4 strings): Step-by-step instructions in Dutch.
3. "safetyTip" (string): One specific safety warning in Dutch.

Output ONLY the valid updated TypeScript array starting with "const baseFallbackLibrary = [" and ending with "];". Do not use markdown blocks.

${arrayStr}`;

  console.log("Calling Gemini...");
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash-8b",
    contents: prompt,
    config: {
      temperature: 0.1
    }
  });
  
  let newArrayStr = response.text || "";
  newArrayStr = newArrayStr.replace(/^```typescript\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
  
  if (newArrayStr.startsWith('const baseFallbackLibrary')) {
    const newCode = code.substring(0, startIdx) + newArrayStr + code.substring(endIdx);
    fs.writeFileSync('src/components/Workout.tsx', newCode);
    console.log("Successfully updated Workout.tsx!");
  } else {
    console.error("Failed to parse Gemini output");
    console.log(newArrayStr.substring(0, 200));
  }
}

run().catch(console.error);
