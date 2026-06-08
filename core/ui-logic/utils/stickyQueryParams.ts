import RouterPathProvider from "@core/RouterPath/RouterPathProvider";

// Patterns: "key=value" sticks only for that value, "key=*" sticks for any value
export const STICKY_QUERY_PARAMS = ["view=*", "mode=markdown"] as const;

const matchesPattern = (pattern: string, key: string, value: string): boolean => {
	const eqIndex = pattern.indexOf("=");
	if (eqIndex === -1) return false;

	const patKey = pattern.slice(0, eqIndex);
	const patVal = pattern.slice(eqIndex + 1);

	if (patKey !== key) return false;
	return patVal === "*" || patVal === value;
};

export const getStickyParams = (targetPathname: string): Record<string, string> => {
	if (!RouterPathProvider.parsePath(targetPathname)?.catalogName) return {};
	if (typeof window === "undefined") return {};

	const searchParams = new URLSearchParams(window.location.search);
	const result: Record<string, string> = {};

	for (const [key, value] of searchParams.entries()) {
		if (STICKY_QUERY_PARAMS.some((pattern) => matchesPattern(pattern, key, value))) {
			result[key] = value;
		}
	}
	return result;
};
