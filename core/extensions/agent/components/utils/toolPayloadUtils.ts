import { isPlainObject } from "./agentTimeline";

export const DEFAULT_EXPANDED_DEPTH = 2;
export const SMALL_CONTAINER_THRESHOLD = 5;
export const EMPTY_PLACEHOLDER = "—";

export const resolveValue = (value: unknown): unknown => {
	if (typeof value === "string") {
		const s = value.trimStart();
		if (s.startsWith("{") || s.startsWith("[")) {
			try {
				return JSON.parse(value);
			} catch {
				return value;
			}
		}
	}
	return value;
};

export const isContainer = (value: unknown): boolean => {
	return Array.isArray(value) || isPlainObject(value);
};

export const toCopyText = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	if (typeof value === "object") return JSON.stringify(value, null, 2);
	return String(value);
};

export const isCopyableLeaf = (value: unknown): boolean => {
	if (value === null || value === undefined) return false;
	if (typeof value === "string") return value !== "" && !/^https?:\/\//.test(value);
	return true;
};

export const entriesOf = (value: unknown): [string | number, unknown][] => {
	if (Array.isArray(value)) return value.map((v, i) => [i, v] as [number, unknown]);
	if (isPlainObject(value)) return Object.entries(value as Record<string, unknown>);
	return [];
};

export const isDefaultOpen = (count: number, depth: number): boolean => {
	return depth < DEFAULT_EXPANDED_DEPTH || (count > 0 && count <= SMALL_CONTAINER_THRESHOLD);
};
