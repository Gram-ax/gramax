import { getConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import Path from "@core/FileProvider/Path/Path";

const getScopeSeparator = () => {
	if (getExecutingEnvironment() === "cli") return "~";
	if (getExecutingEnvironment() === "static" && !getConfig().services.cloud.url) return "~";
	return ":";
};

export const hasScopeSeparator = (value: string): boolean => !!value && value.includes(getScopeSeparator());

/**
 * The scope may already be in the segment percent-encoded — a browser hands back
 * `test-docs%3Areleases%252Fv1.0` for a URL the user opened in encoded form. Cutting only at the literal
 * separator would leave that scope in place and append a second one, producing `catalog%3Aold:new`.
 */
const stripScope = (segment: string, separator: string): string => {
	const cut = (value: string, token: string) => {
		const index = value.toLowerCase().indexOf(token.toLowerCase());
		return index === -1 ? value : value.slice(0, index);
	};
	return cut(cut(segment, separator), encodeURIComponent(separator));
};

export const addScopeToPath = (path: string | string[] | Path, scope?: string, encode = true): string => {
	path = path instanceof Path ? path.value : path;
	path = typeof path === "string" ? path.split("/") : path;
	const idx = path[0] === "" ? 1 : 0;
	const scopeSeparator = getScopeSeparator();
	const unscoped = stripScope(path[idx], scopeSeparator);
	path[idx] = scope ? unscoped + scopeSeparator + (encode ? encodeURIComponent(scope) : scope) : unscoped;
	return path.join("/");
};
