type CompressOptions =
	| {
			type: "image";
			target: "png";
			compressionLevel?: number;
	  }
	| {
			type: "image";
			target: "jpeg" | "webp";
			quality?: number;
			effort?: number;
	  };

type ImageOptions = Extract<CompressOptions, { type: "image" }>;
export type CompressTarget = ImageOptions["target"];
export type CompressRule = { source: string } & Omit<ImageOptions, "type">;
type OptionsFor<T extends CompressTarget> = Omit<ImageOptions & { target: T }, "type" | "target">;

export const COMPRESS_FORMATS: readonly CompressTarget[] = ["png", "jpeg", "webp"];

const PNG_DEFAULTS: OptionsFor<"png"> = { compressionLevel: 6 };
const LOSSY_DEFAULTS: OptionsFor<"jpeg"> = { quality: 80, effort: 4 };

export const defaultOptionsForTarget = (target: CompressTarget): OptionsFor<CompressTarget> => {
	if (target === "png") return { ...PNG_DEFAULTS };
	return { ...LOSSY_DEFAULTS };
};

const OPTIMAL_TARGET: CompressTarget = "jpeg";

/**
 * Rules used when the compression toggle is on but the per-format editor is
 * unavailable: every supported source format is re-encoded to JPEG with the
 * standard lossy options.
 */
export const optimalCompressRules = (): CompressRule[] =>
	COMPRESS_FORMATS.map((source) => ({ source, target: OPTIMAL_TARGET, ...LOSSY_DEFAULTS }));

// Rules are keyed by the canonical format name, files carry either spelling.
const SOURCE_ALIASES: Record<string, string> = { jpg: "jpeg" };

/** Compression options for a file extension, or null when no rule matches it. */
export const compressOptionsFor = (rules: CompressRule[], extension: string): CompressOptions | null => {
	const source = extension?.toLowerCase();
	if (!source) return null;
	const canonical = SOURCE_ALIASES[source] ?? source;
	const rule = rules.find((r) => r.source?.toLowerCase() === canonical);
	if (!rule) return null;
	const { source: _source, ...options } = rule;
	return { type: "image", ...options } as CompressOptions;
};

export default CompressOptions;
