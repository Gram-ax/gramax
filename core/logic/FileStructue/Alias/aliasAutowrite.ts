import type { ItemProps } from "@core/FileStructue/Item/Item";
import { type AliasEntry, aliasPathOf, normalizeAliasPath } from "./AliasIndex";

export type { AliasEntry };
export { aliasPathOf };

export const nowMoved = (): string => {
	return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
};

export const isManualAlias = (entry: AliasEntry): boolean => {
	return typeof entry === "string";
};

export const recordMoveAlias = (props: ItemProps, from: string, to: string, moved = nowMoved()): void => {
	const fromPath = normalizeAliasPath(from);
	const toPath = normalizeAliasPath(to);
	if (!fromPath || fromPath === toPath) return;

	const entries = (Array.isArray(props.aliases) ? props.aliases : []).filter(
		(entry) => aliasPathOf(entry) !== toPath,
	);
	if (!entries.some((entry) => aliasPathOf(entry) === fromPath)) entries.push({ path: fromPath, moved });

	if (entries.length) props.aliases = entries;
	else delete props.aliases;
};

export const dropAutoAlias = (props: ItemProps, alias: string): boolean => {
	if (!Array.isArray(props.aliases)) return false;
	const target = normalizeAliasPath(alias);
	const kept = props.aliases.filter((entry) => isManualAlias(entry) || aliasPathOf(entry) !== target);
	if (kept.length === props.aliases.length) return false;
	if (kept.length) props.aliases = kept;
	else delete props.aliases;
	return true;
};

export const hasManualAlias = (props: ItemProps, alias: string): boolean => {
	if (!Array.isArray(props.aliases)) return false;
	const target = normalizeAliasPath(alias);
	return props.aliases.some((entry) => isManualAlias(entry) && aliasPathOf(entry) === target);
};
