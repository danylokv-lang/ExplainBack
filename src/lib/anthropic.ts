import Anthropic from "@anthropic-ai/sdk";

/**
 * The ExplainBack diagnostic engine.
 *
 * Haiku 4.5 is the default: it keeps the whole explain -> diagnose -> repair
 * cycle inside a few seconds, which is what makes the loop feel like a
 * conversation rather than a submission. EXPLAINBACK_MODEL switches to
 * claude-sonnet-5 for a deeper read of the mechanism.
 */
export const MODEL = process.env.EXPLAINBACK_MODEL || "claude-haiku-4-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export class EngineError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

interface StructuredCall {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}

/**
 * One model call with a guaranteed response shape. `output_config.format`
 * constrains the model to our schema, so there is no parsing of "almost JSON"
 * out of prose and no half-rendered diagnosis on screen.
 */
export async function callStructured<T>({
  system,
  user,
  schema,
  maxTokens,
}: StructuredCall): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new EngineError(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
      503,
    );
  }

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema } },
    });
  } catch (err) {
    if (err instanceof Anthropic.NotFoundError) {
      throw new EngineError(`Model ${MODEL} is not available for this key.`, 502);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new EngineError("Rate limit reached. Try again in a minute.", 429);
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new EngineError("The Anthropic API key was rejected.", 401);
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      throw new EngineError("This key has no access to that model.", 403);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new EngineError("Could not reach the Anthropic API.", 504);
    }
    if (err instanceof Anthropic.APIError) {
      throw new EngineError(`The Anthropic API returned ${err.status ?? "an error"}.`, 502);
    }
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new EngineError("The model declined this request. Try another topic.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new EngineError("The response did not fit the token budget.", 502);
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!text.trim()) throw new EngineError("The model returned an empty response.", 502);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new EngineError("The model response was not valid JSON.", 502);
  }
}
