import { AI_SETTING_KEYS } from "./formSchema";

// `formSchema.ts` stays the single source of truth for which settings keys
// belong to the AI section, even though AI has no app-level form section.
const [AI_ENDPOINT_KEY, AI_TOKEN_KEY] = AI_SETTING_KEYS;

export { AI_ENDPOINT_KEY, AI_TOKEN_KEY };

/**
 * Splits a settings patch into the AI slice (routed to the per-user
 * `AiDataProvider` cookie, never the workspace YAML — AI credentials must not
 * sync through git) and everything else (routed to the workspace YAML store).
 */
export const splitAiKeys = (
	settings: Record<string, unknown>,
): { aiPatch: Record<string, string | undefined> | null; yamlPatch: Record<string, unknown> } => {
	const aiKeys = [AI_ENDPOINT_KEY, AI_TOKEN_KEY] as const;
	let aiPatch: Record<string, string | undefined> | null = null;
	const yamlPatch: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(settings)) {
		if ((aiKeys as readonly string[]).includes(k)) {
			aiPatch ??= {};
			aiPatch[k] = v as string | undefined;
		} else {
			yamlPatch[k] = v;
		}
	}
	return { aiPatch, yamlPatch };
};
