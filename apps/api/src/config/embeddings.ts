import { pipeline } from "@xenova/transformers";
import { env } from "./env";

type FeatureExtractor = Awaited<ReturnType<typeof pipeline<"feature-extraction">>>;

let extractorPromise: Promise<FeatureExtractor> | undefined;

function getExtractor(): Promise<FeatureExtractor> {
  extractorPromise ??= pipeline("feature-extraction", env.EMBEDDING_MODEL);
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true
  });

  const embedding = Array.from(output.data, Number);

  if (embedding.length !== env.EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${env.EMBEDDING_DIMENSIONS} embedding dimensions, got ${embedding.length}`
    );
  }

  return embedding;
}
