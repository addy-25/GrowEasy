import OpenAI from "openai";
import { systemPrompt } from "../services/prompt";
import { CrmRecord } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Supports any OpenAI-compatible provider; unset = official OpenAI API.
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function callLlm(batch: Record<string, string>[]): Promise<CrmRecord[]> {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    // json_object mode guarantees parseable JSON but always returns an
    // object — hence the { "records": [...] } envelope in the prompt.
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify({ rows: batch }) },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content).records ?? [];
}
