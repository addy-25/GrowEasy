import OpenAI from "openai";
import { systemPrompt } from "../services/prompt";
import { CrmRecord } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,   // route requests to AI Credits, not OpenAI
});

export async function callLlm(batch: Record<string, string>[]): Promise<CrmRecord[]> {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",                       // cheap, smart enough for mapping
    temperature: 0,                              // consistent, not creative
    response_format: { type: "json_object" },    // forces valid JSON back
    messages: [
      { role: "system", content: systemPrompt },              // the rules
      { role: "user", content: JSON.stringify({ rows: batch }) }, // the data
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.records ?? [];
}