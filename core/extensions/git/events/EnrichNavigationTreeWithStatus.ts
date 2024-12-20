import { getExecutingEnvironment } from "@app/resolveModule/env";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import type { EventArgs } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import type Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import type { NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export class EnrichNavigationTreeWithStatus implements EventHandlerCollection {
	private _lazyHeadTree: ItemLink[] = null;

	constructor(private _nav: Navigation) {}

	mount() {
		if (getExecutingEnvironment() == "next") return;

		this._nav.events.on("built-nav-tree", async ({ catalog, metadata, ...args }) => {
			if (!getIsDevMode()) return;
			if (!catalog.repo?.gvc) return;
			const statuses = await catalog.repo.status();
			this._updateTree({ catalog, metadata, ...args }, statuses);
		});
	}

	private _updateTree(
		{ catalog, metadata, mutableTree }: EventArgs<NavigationEvents, "built-nav-tree">,
		statuses: GitStatus[],
	) {
		const catalogNameLen = catalog.name.length + 1;
		const statusMap = new Map(statuses.map((status) => [status.path.value, status.status]));

		const applyStatus = (items: ItemLink[]) => {
			for (const el of items) {
				const status = statusMap.get(el.ref.path.slice(catalogNameLen));
				const item = metadata[el.pathname]?.deref();
				if (status) el.status = status;

				const rc = (<Article>item)?.parsedContent?.resourceManager;

				if (rc && (!el.status || el.status == FileStatus.current)) {
					const paths = rc.resources.map((p) => rc.getAbsolutePath(p).value.slice(catalogNameLen));
					for (const path of paths) {
						const status = statusMap.get(path);
						if (status) {
							el.status = FileStatus.modified;
							break;
						}
					}
				}

				if ((<CategoryLink>el).items) applyStatus((<CategoryLink>el).items);
			}
		};

		applyStatus(mutableTree.tree);
	}

	private async _getHeadTree(catalog: Catalog, currentItemLogicPath: string) {
		const head = await catalog.getHeadVersion();
		if (!head) return null;
		return this._nav.getCatalogNav(catalog, currentItemLogicPath);
	}
}
