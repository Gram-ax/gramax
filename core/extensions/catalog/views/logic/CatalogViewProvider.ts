import { GRAMAX_DIRECTORY } from "@app/config/const";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { AppliedCatalogsView, CatalogView } from "@ext/catalog/views/models/CatalogViews";
import { CATALOG_TEMP_VIEW_ID, CATALOG_VIEWS_DIRECTORY } from "@ext/catalog/views/models/consts";
import assert from "assert";
import * as yaml from "js-yaml";

interface CatalogViewProviderProps {
	isReadOnly: boolean;
}

export class CatalogViewProvider {
	private _loaded: boolean = false;
	private _views: Map<string, CatalogView> = new Map();
	private _viewsPath: Path;
	private _events = [];

	constructor(
		private _fp: FileProvider,
		private _catalog: Catalog,
	) {
		this._viewsPath = new Path([this._catalog.basePath.value, GRAMAX_DIRECTORY, CATALOG_VIEWS_DIRECTORY]);
		const isReadOnly = getExecutingEnvironment() !== "web" && getExecutingEnvironment() !== "tauri";
		if (!isReadOnly) return;

		this._readViewsIfNeeded({ isReadOnly });
		this._events.push(this._catalog.events.on("sync", () => this._onSyncCatalog()));
	}

	public async getViews(offset: number, limit: number, search?: string, options?: CatalogViewProviderProps) {
		await this._readViewsIfNeeded(options);

		return Array.from(this._views.values())
			.filter((view) => (search ? view.name.toLowerCase().includes(search.toLowerCase()) : true))
			.filter((view) => !view.options?.temp)
			.slice(offset, offset + limit);
	}

	public async applyView(contextualCatalog: ContextualCatalog, viewId: string) {
		const currentView = contextualCatalog.props.resolvedView?.id;
		const view = currentView === viewId ? null : await this.getViewById(viewId);
		this._applyView(view, contextualCatalog);
	}

	public async applyTempView(contextualCatalog: ContextualCatalog, view: CatalogView) {
		if (view) this._views.set(CATALOG_TEMP_VIEW_ID, view);
		else this._views.delete(CATALOG_TEMP_VIEW_ID);

		this._applyView(view, contextualCatalog);
	}

	public async createView(view: CatalogView) {
		await this._readViewsIfNeeded();
		assert(!this._views.has(view.id), `View ${view.id} already exists in catalog ${this._catalog.name}`);

		const path = this._getViewPath(view.id);
		delete view.options?.temp;

		await this._saveView(path, view);
		this._views.set(view.id, view);
	}

	public async getViewById(viewId: string) {
		await this._readViewsIfNeeded();
		return this._views.get(viewId);
	}

	public getLoadedViewById(viewId: string): CatalogView {
		return this._views.get(viewId);
	}

	public async updateView(view: CatalogView) {
		await this._readViewsIfNeeded();
		assert(this._views.has(view.id), `View ${view.id} not found in catalog ${this._catalog.name}`);

		const path = this._getViewPath(view.id);
		await this._saveView(path, view);
		this._views.set(view.id, view);
	}

	public async deleteView(viewId: string) {
		const path = this._getViewPath(viewId);
		assert(this._views.has(viewId), `View ${viewId} not found in catalog ${this._catalog.name}`);
		await this._fp.delete(path);
		this._views.delete(viewId);
	}

	private _applyView(view: CatalogView, contextualCatalog: ContextualCatalog) {
		const viewIds = JSON.parse(contextualCatalog.ctx.cookie.get("viewIds") || "{}") as AppliedCatalogsView;
		if (view) viewIds[contextualCatalog.name] = view?.id;
		else delete viewIds[contextualCatalog.name];

		if (!Object.keys(viewIds).length) contextualCatalog.ctx.cookie.remove("viewIds");
		else contextualCatalog.ctx.cookie.set("viewIds", JSON.stringify(viewIds));
	}

	private _onSyncCatalog() {
		this._views.clear();
		this._loaded = false;

		this._readViewsIfNeeded({ isReadOnly: true });
	}

	private async _readViewsIfNeeded(options?: CatalogViewProviderProps) {
		if (this._loaded) return;
		if (!(await this._fp.exists(this._viewsPath))) {
			this._loaded = true;
			return;
		}

		const fpItems = await this._fp.getItems(this._viewsPath);
		const views: CatalogView[] = [];

		const isReadOnly = options?.isReadOnly;

		for (const item of fpItems) {
			if (item.isDirectory() || !item.path.nameWithExtension.endsWith(".yaml")) continue;
			const parsedView = await this._parseView(item.path);

			if (!parsedView) continue;
			if (isReadOnly && !parsedView?.options?.docportalVisible) continue;
			views.push(parsedView);
		}

		views.sort((a, b) => a.name.localeCompare(b.name)).forEach((view) => this._views.set(view.id, view));
		this._loaded = true;
	}

	private _getViewPath(id: string) {
		return this._viewsPath.join(new Path(`${id}.yaml`));
	}

	private async _parseView(path: Path): Promise<CatalogView> {
		let props: CatalogView;
		try {
			props = yaml.load(await this._fp.read(path)) as CatalogView;
			if (typeof props !== "object") throw "Wrong format";
		} catch (e) {
			console.error("yaml invalid", e);
			props = null;
		}
		return props;
	}

	private async _saveView(path: Path, data: CatalogView) {
		await this._fp.write(path, yaml.dump(data));
	}
}
