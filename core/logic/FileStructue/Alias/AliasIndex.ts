export type AliasEntry = string | { path: string; moved?: string };

export type AliasSource = {
	logicPath: string;
	isCategory: boolean;
	aliases?: AliasEntry[];
};

type AliasClaim = {
	owner: string;
	isCategory: boolean;
	moved?: string;
};

const MAX_CANDIDATES = 10;
const MOVED_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export type AliasDiagnostic =
	| { kind: "self-alias"; owner: string; path: string }
	| { kind: "shadowed-by-real"; owner: string; path: string }
	| { kind: "duplicate"; path: string; winner: string; loser: string }
	| { kind: "broken-moved"; owner: string; path: string; moved: string };

export class AliasIndex {
	private constructor(
		private readonly _exact: Map<string, string>,
		private readonly _prefix: [string, string][],
		private readonly _categoryHistory: Map<string, string[]>,
		private readonly _live: Set<string>,
		public readonly diagnostics: AliasDiagnostic[],
	) {}

	static build(sources: Iterable<AliasSource>): AliasIndex {
		const sorted = [...sources].sort((a, b) => a.logicPath.localeCompare(b.logicPath));
		const live = new Set(sorted.map((s) => s.logicPath));

		const claims = new Map<string, AliasClaim[]>();
		const categoryHistory = new Map<string, string[]>();
		const diagnostics: AliasDiagnostic[] = [];

		for (const source of sorted) {
			const entries = AliasIndex._readEntries(source);
			const history: { path: string; moved?: string }[] = [];
			for (const entry of entries) {
				if (entry.moved && !validMoved(entry.moved)) {
					diagnostics.push({
						kind: "broken-moved",
						owner: source.logicPath,
						path: entry.path,
						moved: entry.moved,
					});
				}
				if (entry.path === source.logicPath) {
					diagnostics.push({ kind: "self-alias", owner: source.logicPath, path: entry.path });
					continue;
				}
				if (live.has(entry.path)) {
					diagnostics.push({ kind: "shadowed-by-real", owner: source.logicPath, path: entry.path });
					continue;
				}
				const list = claims.get(entry.path) ?? [];
				list.push({ owner: source.logicPath, isCategory: source.isCategory, moved: entry.moved });
				claims.set(entry.path, list);
				history.push(entry);
			}
			if (source.isCategory && history.length) {
				history.sort(byMovedAscendingUndatedLast);
				categoryHistory.set(
					source.logicPath,
					history.map((e) => e.path),
				);
			}
		}

		const exact = new Map<string, string>();
		const prefix: [string, string][] = [];
		for (const [alias, claimants] of claims) {
			const winner = claimants.reduce((best, next) => (compareClaims(next, best) > 0 ? next : best));
			for (const claim of claimants) {
				if (claim !== winner)
					diagnostics.push({ kind: "duplicate", path: alias, winner: winner.owner, loser: claim.owner });
			}
			exact.set(alias, winner.owner);
			if (winner.isCategory) prefix.push([alias, winner.owner]);
		}
		prefix.sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0]));

		return new AliasIndex(exact, prefix, categoryHistory, live, diagnostics);
	}

	get isEmpty(): boolean {
		return this._exact.size === 0;
	}

	resolve(logicPath: string): string | null {
		if (this.isEmpty) return null;
		const stack = [logicPath];
		const visited = new Set<string>();
		let evaluated = 0;

		while (stack.length) {
			const candidate = stack.pop();
			if (visited.has(candidate)) continue;
			visited.add(candidate);
			if (++evaluated > MAX_CANDIDATES) return null;

			if (candidate !== logicPath && this._live.has(candidate)) return candidate;
			const exact = this._exact.get(candidate);
			if (exact) return exact;

			const prefixed = this._longestPrefix(candidate);
			if (!prefixed) continue;
			const [alias, category] = prefixed;
			const tail = candidate.slice(alias.length + 1);
			const history = this._categoryHistory.get(category);
			if (history) for (let i = history.length - 1; i >= 0; i--) stack.push(`${history[i]}/${tail}`);
			stack.push(`${category}/${tail}`);
		}
		return null;
	}

	private _longestPrefix(path: string): [string, string] | undefined {
		return this._prefix.find(
			([alias]) => path.length > alias.length && path.startsWith(alias) && path[alias.length] === "/",
		);
	}

	private static _readEntries(source: AliasSource): { path: string; moved?: string }[] {
		if (!Array.isArray(source.aliases)) return [];
		const seen = new Set<string>();
		const entries: { path: string; moved?: string }[] = [];
		for (const raw of source.aliases) {
			if (typeof raw !== "string" && (!raw || typeof raw !== "object")) continue;
			const path = aliasPathOf(raw);
			if (!path || seen.has(path)) continue;
			seen.add(path);
			const moved = typeof raw === "string" ? undefined : typeof raw.moved === "string" ? raw.moved : "";
			entries.push({ path, moved });
		}
		return entries;
	}
}

export const normalizeAliasPath = (path: string): string => {
	let p = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
	if (p.endsWith(".md")) p = p.slice(0, -3);
	return p;
};

export const aliasPathOf = (entry: AliasEntry): string => {
	if (typeof entry === "string") return normalizeAliasPath(entry);
	return typeof entry?.path === "string" ? normalizeAliasPath(entry.path) : "";
};

const validMoved = (moved?: string): string | undefined => {
	return moved && MOVED_FORMAT.test(moved) ? moved : undefined;
};

const byMovedAscendingUndatedLast = (a: { path: string; moved?: string }, b: { path: string; moved?: string }) => {
	const am = validMoved(a.moved);
	const bm = validMoved(b.moved);
	if (am && bm) return am.localeCompare(bm) || a.path.localeCompare(b.path);
	if (am) return -1;
	if (bm) return 1;
	return a.path.localeCompare(b.path);
};

const compareClaims = (a: AliasClaim, b: AliasClaim): number => {
	const rank = (c: AliasClaim) => (c.moved === undefined ? 2 : validMoved(c.moved) ? 1 : 0);
	if (rank(a) !== rank(b)) return rank(a) - rank(b);
	const am = validMoved(a.moved);
	const bm = validMoved(b.moved);
	if (am && bm && am !== bm) return am.localeCompare(bm);
	return b.owner.localeCompare(a.owner);
};
