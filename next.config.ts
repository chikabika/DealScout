import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly forward the Anthropic env vars to the server runtime.
  // Next.js only auto-exposes NEXT_PUBLIC_* vars to the browser; server-side
  // vars in .env.local are available to Next.js itself but can be missed by
  // modules that read process.env at module-load time (like the Anthropic
  // client). Listing them here guarantees they're baked into the server bundle.
  // Model IDs are optional overrides — the classifier/scorer have sane defaults.
  env: {
    ANTHROPIC_API_KEY:             process.env.ANTHROPIC_API_KEY             ?? '',
    ANTHROPIC_CLASSIFIER_MODEL_ID: process.env.ANTHROPIC_CLASSIFIER_MODEL_ID ?? '',
    ANTHROPIC_SCORER_MODEL_ID:     process.env.ANTHROPIC_SCORER_MODEL_ID     ?? '',
    ANTHROPIC_MODEL_ID:            process.env.ANTHROPIC_MODEL_ID            ?? '',
  },
};

export default nextConfig;
