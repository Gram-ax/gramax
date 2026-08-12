import type { Article } from "@core/FileStructue/Article/Article";
import type { ArticleFilter, Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogItemSearcher } from "@core/FileStructue/Catalog/CatalogItemSearcher";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import assert from "assert";
import { type AliasEntry, AliasIndex, type AliasSource, aliasPathOf } from "./AliasIndex";
import { dropAutoAlias, hasManualAlias } from "./aliasAutowrite";

type AliasConflict = { item: Item; kind: "path" | "alias" };

export class CatalogAliases {
	private _index: AliasIndex = null;

	constructor(
		private readonly _catalog: Catalog,
		private readonly _searcher: CatalogItemSearcher,
	) {}

	invalidate(): void {
		this._index = null;
	}

	findArticle(logicPath: string, filters: ArticleFilter[] = [], root?: Category): Article {
		const resolvedRoot = root ?? this._catalog.getRootCategory();
		let target = this.index.resolve(logicPath);

		const mainRoot = this._catalog.getRootCategory().logicPath;
		if (
			!target &&
			resolvedRoot.logicPath !== mainRoot &&
			`${logicPath}/`.startsWith(`${resolvedRoot.logicPath}/`)
		) {
			const tail = logicPath.slice(resolvedRoot.logicPath.length + 1);
			const mainTarget = this.index.resolve(`${mainRoot}/${tail}`);
			if (mainTarget && `${mainTarget}/`.startsWith(`${mainRoot}/`))
				target = `${resolvedRoot.logicPath}/${mainTarget.slice(mainRoot.length + 1)}`;
		}

		if (!target || target === logicPath) return null;
		return this._searcher.findItemByLogicPath(resolvedRoot, target, filters) as Article;
	}

	diagnostics() {
		return this.index.diagnostics;
	}

	assertNotManual(alias: string, mover: Item): void {
		if (!alias) return;
		for (const item of this._catalog.getItems([])) {
			if (item === mover) continue;
			assert(
				!hasManualAlias(item.props, alias),
				`Path '${alias}' is a manual alias of '${this._catalog.relativeLogicPath(item.logicPath)}'. Remove that alias or pick another name.`,
			);
		}
	}

	assertFree(alias: string, forItem: Item): void {
		const conflict = this._findConflict(alias, forItem);
		if (!conflict) return;
		assert(conflict.kind !== "path", `Alias '${alias}' equals the path of an existing item`);
		assert(
			!conflict,
			`Alias '${alias}' is already used by '${this._catalog.relativeLogicPath(conflict.item.logicPath)}'`,
		);
	}

	async stealAuto(alias: string, newOwner: Item): Promise<void> {
		for (const item of this._catalog.getItems([])) {
			if (item === newOwner) continue;
			if (dropAutoAlias(item.props, alias)) await item.save();
		}
	}

	async dropConflicting(item: Item): Promise<void> {
		if (!Array.isArray(item.props.aliases)) return;
		const own = this._catalog.relativeLogicPath(item.logicPath);
		const kept = item.props.aliases.filter((entry) => {
			const path = aliasPathOf(entry);
			return path && path !== own && !this._findConflict(path, item);
		});
		if (kept.length === item.props.aliases.length) return;
		if (kept.length) item.props.aliases = kept;
		else delete item.props.aliases;
		await item.save();
		this._searcher.resetCache();
		this.invalidate();
	}

	private get index(): AliasIndex {
		this._index ??= AliasIndex.build(this._collectSources());
		return this._index;
	}

	private _collectSources(): AliasSource[] {
		const root = this._catalog.getRootCategory();
		if (!root) return [];
		const prefix = (raw: AliasEntry) => {
			const relative = aliasPathOf(raw);
			if (!relative) return null;
			const path = `${root.logicPath}/${relative}`;
			return typeof raw === "string" ? path : { ...raw, path };
		};
		return this._catalog.getItems([]).map((item) => ({
			logicPath: item.logicPath,
			isCategory: item.type === ItemType.category,
			aliases: Array.isArray(item.props.aliases) ? item.props.aliases.map(prefix).filter(Boolean) : undefined,
		}));
	}

	private _findConflict(alias: string, forItem: Item): AliasConflict | null {
		if (!alias) return null;
		for (const item of this._catalog.getItems([])) {
			if (item === forItem) continue;
			if (this._catalog.relativeLogicPath(item.logicPath) === alias) return { item, kind: "path" };
			if (Array.isArray(item.props.aliases) && item.props.aliases.some((e) => aliasPathOf(e) === alias))
				return { item, kind: "alias" };
		}
		return null;
	}
}
