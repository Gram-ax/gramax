import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { UnsubscribeToken } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { PropertyTypes } from "@ext/properties/models";
import { GitTreeScopeParser } from "@ext/versioning/GitTreeScopeParser";
import type { Workspace } from "@ext/workspace/Workspace";

export default class ScopedCatalogsResolver implements EventHandlerCollection {
	private _unsubscribeTokens: UnsubscribeToken[] = [];

	constructor(
		private _workspace: Workspace,
		private _rp: RepositoryProvider,
	) {}

	mount(): void {
		if (getExecutingEnvironment() === "next") return; // todo: add support in docportal

		const token = this._workspace.events.on("on-catalog-resolve", async ({ mutableCatalog, metadata }) => {
			const refname = metadata;
			if (!refname || !mutableCatalog.catalog) return;

			if (this._shouldSkipProperty(mutableCatalog.catalog, refname)) return;
			const shouldSkip = mutableCatalog.catalog.props.resolvedVersions?.find(
				(t) => t.encodedName === refname || t.name === refname,
			);

			if (shouldSkip) return;

			const gvc = mutableCatalog.catalog?.repo?.gvc;
			if (!gvc) return;
			const scope = GitTreeScopeParser.parse(refname) ?? { reference: refname };

			const catalog = await mutableCatalog.catalog.repo.scopedCatalogs.getScopedCatalog(
				mutableCatalog.catalog.basePath,
				this._workspace.getFileStructure(),
				scope,
			);

			mutableCatalog.catalog = await catalog.load();
		});

		this._unsubscribeTokens.push(token);
	}

	private _shouldSkipProperty(catalog: BaseCatalog, refname: string): boolean {
		const property = catalog.props.properties?.find((p) => (p.id ?? p.name) === catalog.props.filterProperty);
		if (refname.startsWith("view-")) return true;
		if (!property) return false;

		if (property.type === PropertyTypes.flag) return refname === "any" || refname === property.name;
		if (property.type === PropertyTypes.many || property.type === PropertyTypes.enum)
			return refname === "any" || property.values.includes(refname);
		return false;
	}
}
