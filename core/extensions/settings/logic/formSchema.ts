import t from "@ext/localization/locale/translate";
import { Level as OtelLogLevel } from "@ext/loggers/opentelemetry/span";
import { z } from "zod";

// Mirror of @core/FileProvider/model/CompressOptions discriminated union, plus
// `source`. PNG carries `compressionLevel` (zlib 0–9). JPEG/WebP carry
// `quality` (1–100) and `effort` (0–10). Keep target literals in sync with
// COMPRESS_FORMATS in @core/FileProvider/model/CompressOptions. zod
// `discriminatedUnion` needs a literal per variant, so jpeg and webp are split
// here even though they share the same lossy option shape.
const lossyRule = {
	source: z.string().min(1),
	quality: z.number().min(1).max(100).optional(),
	effort: z.number().min(0).max(10).optional(),
} as const;

const compressRuleSchema = z.discriminatedUnion("target", [
	z.object({
		source: z.string().min(1),
		target: z.literal("png"),
		compressionLevel: z.number().min(0).max(9).optional(),
	}),
	z.object({ ...lossyRule, target: z.literal("jpeg") }),
	z.object({ ...lossyRule, target: z.literal("webp") }),
]);

// One rule per source format. Duplicate sources are a soft concern surfaced in
// the compress-images UI — they must NOT hard-block saving the whole settings
// form (a single shared form spans every section).
const compressRulesSchema = z.array(compressRuleSchema).default([]);

export type AiCheck = {
	checkServer: (apiUrl: string) => Promise<boolean>;
	checkToken: (apiUrl: string, token: string) => Promise<boolean>;
};

// AI block for the workspace-level form.
// Single source for the three refines (server reachable, token presence, token valid).
export const createAiSchema = ({ checkServer, checkToken }: AiCheck) =>
	z
		.object({
			endpoint: z.string().optional().or(z.literal("")),
			token: z.string().optional().or(z.literal("")),
		})
		.refine(
			async (val) => {
				if (!val.endpoint) return true;
				return await checkServer(val.endpoint);
			},
			{ message: t("workspace.ai-server-error"), path: ["endpoint"] },
		)
		.refine((val) => !(val.endpoint && !val.token), {
			message: t("workspace.ai-token-set-error"),
			path: ["token"],
		})
		.refine(
			async (val) => {
				if (!val.endpoint || !val.token) return true;
				return await checkToken(val.endpoint, val.token);
			},
			{ message: t("workspace.ai-token-error"), path: ["token"] },
		)
		.optional();

// AI lives at the workspace level only (see AppSettings.services.ai), so these
// keys never appear in the app-level form — the settings update command still
// needs them to route the AI slice to the per-user cookie store.
export const AI_SETTING_KEYS = ["services.ai.endpoint", "services.ai.token"] as const;

export const SERVICE_SETTING_KEYS = ["web-editor", "auth", "diagram-renderer", "git-proxy"] as const;

// Each service is an object so it can grow beyond `endpoint` (mirrors `ai`,
// which carries endpoint + token). Single-field today, extensible tomorrow.
const serviceSchema = z.object({ endpoint: z.string().url().or(z.literal("")).optional() }).optional();

export const servicesSchema = z.object({
	"web-editor": serviceSchema,
	auth: serviceSchema,
	"diagram-renderer": serviceSchema,
	"git-proxy": serviceSchema,
});

export const createAppSettingsFormSchema = () =>
	z.object({
		general: z.object({
			language: z.string(),
			theme: z.string(),
		}),
		services: servicesSchema,
		"compress-images": z.object({
			enabled: z.boolean(),
			rules: compressRulesSchema,
		}),
		logging: z.object({
			// `Off` disables logging; any other level enables it at that verbosity.
			level: z.nativeEnum(OtelLogLevel),
			console: z.boolean(),
		}),
		contentCompare: z.object({
			sensitivity: z.enum(["word", "character", "hybrid"]),
			minSimilarity: z.number().min(0).max(1),
			debounce: z.number().min(0).max(1000),
			minMatchLength: z.number().min(1).max(10),
		}),
	});

export type AppSettingsFormData = z.infer<ReturnType<typeof createAppSettingsFormSchema>>;

const APP_LEVEL_KEYS = {
	// The compression switch lives in the General section (the dedicated tab is gone).
	general: ["general.language", "general.theme", "compress-images.enabled", "compress-images.rules"],
	services: SERVICE_SETTING_KEYS.map((key) => `services.${key}.endpoint`),
	updates: ["updates.check-frequency"],
	"experimental-features": [],
	diagnostics: ["logging.level", "logging.console"],
	contentCompare: [
		"contentCompare.sensitivity",
		"contentCompare.minSimilarity",
		"contentCompare.debounce",
		"contentCompare.minMatchLength",
	],
} as const;

export type AppSettingsTab = keyof typeof APP_LEVEL_KEYS;

export const getSectionKeys = (tab: AppSettingsTab): readonly string[] => APP_LEVEL_KEYS[tab];

export const diffPatch = (
	data: Record<string, unknown>,
	defaults: Record<string, unknown> | undefined,
	prefix = "",
): Record<string, unknown> => {
	const patch: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		const path = prefix ? `${prefix}.${key}` : key;
		const defaultValue = defaults?.[key];
		if (Array.isArray(value)) {
			if (JSON.stringify(value) !== JSON.stringify(defaultValue)) patch[path] = value;
			continue;
		}
		if (value !== null && typeof value === "object") {
			Object.assign(
				patch,
				diffPatch(
					value as Record<string, unknown>,
					(defaultValue as Record<string, unknown>) ?? undefined,
					path,
				),
			);
			continue;
		}
		if (value !== defaultValue) patch[path] = value;
	}
	return patch;
};
