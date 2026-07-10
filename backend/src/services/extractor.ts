import { CrmRecord } from "../types";
import { callLlm } from "../llm/openai";

const BATCH_SIZE = 20;
const MAX_RETRIES = 3;

const parsed = Number(process.env.EXTRACTOR_CONCURRENCY);
const CONCURRENCY = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

export async function extractAll(rows: Record<string, string>[]): Promise<CrmRecord[]> {
  const batches: Record<string, string>[][] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }


  const results: CrmRecord[][] = new Array(batches.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < batches.length) {
      const index = nextIndex++;
      results[index] = await withRetry(() => callLlm(batches[index]), MAX_RETRIES);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => worker())
  );

  return results.flat();
}

async function withRetry<T>(fn: () => Promise<T>, tries: number): Promise<T> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === tries) throw e;
      
      const delay = 2 ** attempt * 750 + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}
