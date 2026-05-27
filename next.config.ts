import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly forward AWS / Bedrock env vars to the server runtime.
  // Next.js only auto-exposes NEXT_PUBLIC_* vars to the browser; server-side
  // vars in .env.local are available to Next.js itself but can be missed by
  // modules that read process.env at module-load time (like the Bedrock client).
  // Listing them here guarantees they're baked into the server bundle.
  env: {
    AWS_ACCESS_KEY_ID:     process.env.AWS_ACCESS_KEY_ID     ?? '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    AWS_DEFAULT_REGION:    process.env.AWS_DEFAULT_REGION    ?? 'us-east-1',
    BEDROCK_MODEL_ID:      process.env.BEDROCK_MODEL_ID      ?? 'anthropic.claude-3-haiku-20240307-v1:0',
  },
};

export default nextConfig;
