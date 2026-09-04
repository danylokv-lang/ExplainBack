// Bridges the wrangler-generated `Env` (worker-configuration.d.ts, from
// `wrangler types`) into `CloudflareEnv`, the interface @opennextjs/cloudflare
// uses for `getCloudflareContext().env`. Regenerate worker-configuration.d.ts
// with `npx wrangler types` whenever wrangler.jsonc's bindings change.
declare global {
  interface CloudflareEnv extends Env {}
}

export {};
