import { CrmRecord } from "../types";
import { callLlm } from "../llm/openai";


export async function extractAll(rows: Record<string,string>[]) {
  const BATCH = 20;
  const results: CrmRecord[] = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const parsed = await withRetry(() => callLlm(batch), 3);
    results.push(...parsed);
  }
  return results;
}

async function withRetry<T>(fn: () => Promise<T>, tries: number): Promise<T> {
  for (let a = 1; a <= tries; a++) {
    try { return await fn(); }
    catch (e) { if (a === tries) throw e;
      await new Promise(r => setTimeout(r, 2 ** a * 500)); } // backoff
  }
  throw new Error("unreachable");
}