import type { AppConfig, ServicesConfig } from "@app/config/AppConfig";
import { WORKSPACE_CONFIG_FILENAME } from "@app/config/const";

import resolveModule from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type { CatalogFilesUpdated } from "@core/FileStructue/Catalog/CatalogEvents";
import FileStructure from "@core/FileStructue/FileStructure";
import mergeObjects from "@core/utils/mergeObjects";
import { uniqueName } from "@core/utils/uniqueName";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import { EnterpriseWorkspace } from "@ext/enterprise/EnterpriseWorkspace";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import t from "@ext/localization/locale/translate";
import NoActiveWorkspace from "@ext/workspace/error/NoActiveWorkspaceError";
import WorkspaceMissingPath from "@ext/workspace/error/UnknownWorkspace";
import WorkspaceRepositoriesOverview from "@ext/workspace/UnintializedWorkspace";
import { Workspace, type WorkspaceInitCallback } from "@ext/workspace/Workspace";
import WorkspaceAssets from "@ext/workspace/WorkspaceAssets";
import type { WorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { getBaseCatalogName } from "../../../apps/gramax-cli/src/logic/initialDataUtils/getCatalogName";

export type FSCreatedCallback = (fs: FileStructure) => void;
export type CatalogChangedCallback = (change: CatalogFilesUpdated) => void | Promise<void>;
export type FSCatalogsInitializedCallback = (fp: FileProvider, catalogs: CatalogEntry[]) => void;
export type FSFileProviderFactory = (path: WorkspacePath) => MountFileProvider;

export type WorkspaceManagerConfig = { "latest-workspace"?: WorkspacePath; workspaces?: WorkspacePath[] };

export type WorkspaceConfigWithCatalogs = {
	catalogNames: string[];
	config: YamlFileConfig<WorkspaceConfig>;
};

export type WorkspaceManagerEvents = Event<"workspace-changed", { workspace: Workspace }>;

const workspaceConfigFilename = new Path(WORKSPACE_CONFIG_FILENAME);
const DEFAULT_WORKSPACE_NAME = "workspace.default-name";
const DEFAULT_WORKSPACE_ICON = "layers";
const LATEST_WORKSPACE_KEY = "latest-workspace";

export default class WorkspaceManager {
	private _current: Workspace;
	private _workspaces: Map<WorkspacePath, WorkspaceConfigWithCatalogs> = new Map();
	private _rules: CatalogChangedCallback[] = [];
	private _events = createEventEmitter<WorkspaceManagerEvents>();

	constructor(
		private _makeFileProvider: FSFileProviderFactory,
		private _callback: FSCreatedCallback,
		private _onInit: WorkspaceInitCallback,
		private _rp: RepositoryProvider,
		private _config: AppConfig,
		private _workspacesConfig: YamlFileConfig<WorkspaceManagerConfig>,
	) {}

	get events() {
		return this._events;
	}

	async getUnintializedWorkspaces() {
		const current = this.maybeCurrent()?.path();
		if (!current) return [];

		const workspaces = Array.from(this._workspaces.keys() || []).filter((w) => w !== current);

		return await workspaces.mapAsync(async (w) => {
			return await WorkspaceRepositoriesOverview.init({
				path: w,
				fs: new FileStructure(this._makeFileProvider(w), this._config.isReadOnly),
				rp: this._rp,
			});
		});
	}

	async setWorkspace(path: WorkspacePath) {
		if (!path) throw new Error(`Invalid workspace path ${path}`);
		const { config: init } = this._workspaces.get(path);
		if (!init) throw new Error(`There is no workspace with id '${path}'`);
		const fp = this._makeFileProvider(path);
		await fp.createRootPathIfNeed();
		const fs = new FileStructure(fp, this._config.isReadOnly);
		this._callback(fs);

		const WorkspaceClass = init.get("enterprise")?.gesUrl || init.get("gesUrl") ? EnterpriseWorkspace : Workspace;
		this._current = await WorkspaceClass.init({
			fs,
			rp: this._rp,
			path,
			config: init,
			assets: this.getWorkspaceAssets(path),
			onInit: this._onInit,
		});

		this._rules?.forEach((fn) => this._current.events.on("catalog-changed", fn));

		this._current.events.on("add-catalog", (catalog) => {
			const current = this._workspaces.get(this._current.path());
			if (!current || current.catalogNames.includes(catalog.catalog.name)) return;

			current.catalogNames.push(catalog.catalog.name);
		});

		this._current.events.on("remove-catalog", (catalog) => {
			const current = this._workspaces.get(this._current.path());
			if (!current) return;

			current.catalogNames = current.catalogNames.filter((name) => name != catalog.name);
		});

		this._setLatestWorkspace(this._current.path());
		await this.saveWorkspaces();

		await this._events.emit("workspace-changed", { workspace: this._current });
	}

	async readWorkspaces(): Promise<void> {
		await Promise.all(this._workspacesConfig.get("workspaces")?.map((w) => this.addWorkspace(w)) ?? []);

		if (
			this._config.paths.root &&
			!Array.from(this._workspaces.keys()).find((path) => path == this._config.paths.root.value)
		)
			await this._importWorkspaceFromRootPath();

		this.removeInvalidWorkspaces();

		if (!this._workspacesConfig.get("workspaces") || this._workspacesConfig.get("workspaces").length == 0) {
			if (getExecutingEnvironment() == "tauri") return;
			await this._createDefaultWorkspace();
		}

		const latest = this._getLatestWorkspace();
		const path = this._workspaces.get(latest) ? latest : this.workspaces()[0].path;

		path && (await this.setWorkspace(path));
	}

	async addWorkspace(
		path: WorkspacePath,
		config?: WorkspaceConfig,
		create = false,
		skipIfNoDirs = false,
	): Promise<WorkspacePath> {
		if (!path || typeof path !== "string") throw new WorkspaceMissingPath(config?.name);
		const fp = this._makeFileProvider(path);

		if (!(await fp.isRootPathExists())) {
			if (!create) return;
			await fp.createRootPathIfNeed();
		}

		if (skipIfNoDirs && (await fp.readdir(Path.empty)).length == 0) return;

		const yaml = await this.readWorkspace(fp, config);

		this._workspaces.set(path, yaml);

		return path;
	}

	async currentOrDefault() {
		if (this.maybeCurrent()) return this.maybeCurrent();
		if (!this.workspaces()?.[0]?.path) await this._createDefaultWorkspace();
		await this.setWorkspace(this.workspaces()[0].path);
		return this.maybeCurrent();
	}

	getWorkspaceConfig(path: WorkspacePath) {
		return this._workspaces.get(path);
	}

	getWorkspaceAssets(path: WorkspacePath): WorkspaceAssets | null {
		if (!path || path === this._current?.path()) {
			if (this.hasWorkspace()) return this._current.getAssets();
			return null;
		}

		if (!this._workspaces.get(path)) throw new Error(`Workspace with path ${path} not found`);
		const fp = this._makeFileProvider(this._getAssetsPath(path).value);
		return new WorkspaceAssets(fp);
	}

	async saveWorkspaces() {
		this._workspacesConfig.set("workspaces", Array.from(this._workspaces.keys()));
		await this._workspacesConfig.save();
	}

	async removeWorkspace(path: WorkspacePath) {
		const fp = this._makeFileProvider(path);
		if (getExecutingEnvironment() == "browser") await fp.delete(Path.empty);
		this._workspaces.delete(path);
		await this.saveWorkspaces();
		if (this.current().path() == path && this.workspaces()?.[0]?.path) {
			await this.setWorkspace(this.workspaces()[0].path);
		}
	}

	defaultPath() {
		return this._config.paths.default;
	}

	setDefaultPath(path: Path) {
		this._config.paths.default = path;
	}

	workspaces() {
		return Array.from(this._workspaces.entries())
			.map(([path, val]) => ({ path, ...val.config.inner() }))
			.sort((a, b) =>
				a.name.localeCompare(b.name, undefined, { sensitivity: "variant", ignorePunctuation: true }),
			);
	}

	hasWorkspace() {
		return !!this._current;
	}

	async getCatalogOrFindAtAnyWorkspace(catalogName: string): Promise<Catalog> {
		const current = this.maybeCurrent();

		if (!current) return null;
		const catalog = await current.getContextlessCatalog(catalogName);
		if (catalog) return catalog;

		for (const [path, { catalogNames }] of this._workspaces.entries()) {
			if (catalogNames.includes(catalogName)) {
				await this.setWorkspace(path);
				return this.current().getContextlessCatalog(catalogName);
			}
		}

		return null;
	}

	maybeCurrent() {
		return this._current;
	}

	current() {
		if (!this._current) throw new NoActiveWorkspace();
		return this.maybeCurrent();
	}

	onCatalogChange(callback: CatalogChangedCallback) {
		this._rules.push(callback);
		this.maybeCurrent()?.events.on("catalog-changed", callback);
	}

	private async readWorkspace(fp: FileProvider, config?: WorkspaceConfig): Promise<WorkspaceConfigWithCatalogs> {
		const yaml = await YamlFileConfig.readFromFile(fp, workspaceConfigFilename, {
			name: config?.name || t(DEFAULT_WORKSPACE_NAME),
			icon: config?.icon || DEFAULT_WORKSPACE_ICON,
			groups: config?.groups ?? null,
			sections: config?.sections ?? null,
			enterprise: {
				gesUrl: config?.enterprise?.gesUrl ?? null,
				lastUpdateDate: config?.enterprise?.lastUpdateDate ?? null,
				refreshInterval: config?.enterprise?.refreshInterval ?? null,
			},
			services: mergeObjects<ServicesConfig>(this._config.services, config?.services ?? {}),
		});

		const name = yaml.get("name");
		yaml.set(
			"name",
			uniqueName(
				name || t(DEFAULT_WORKSPACE_NAME),
				this.workspaces().map((w) => w.name),
				"",
				" ",
			),
		);

		if (!yaml.get("enterprise")?.gesUrl) yaml.set("services", this._config.services);
		if (yaml.get("name") != name) await yaml.save();

		const catalogNames = await FileStructure.getCatalogDirs(fp);
		return { catalogNames: catalogNames.map((i) => i.name), config: yaml };
	}

	private removeInvalidWorkspaces() {
		for (const path of this._workspacesConfig.get("workspaces") ?? []) {
			if (!this._workspaces.get(path))
				this._workspacesConfig.set(
					"workspaces",
					[...this._workspacesConfig.inner().workspaces]?.filter((p) => p != path),
				);
		}
	}

	private async _importWorkspaceFromRootPath() {
		const init = {
			name: t(DEFAULT_WORKSPACE_NAME),
			icon: DEFAULT_WORKSPACE_ICON,
		};
		const path = this._config.paths.root.value;
		const rootFp = this._makeFileProvider(path);

		if (!(await rootFp.isRootPathExists()) || !(await rootFp.readdir(Path.empty).then((r) => r.length)))
			return false;

		await this.addWorkspace(path, init);
		await this.saveWorkspaces();
	}

	private async _createDefaultWorkspace() {
		const init = {
			name: t(DEFAULT_WORKSPACE_NAME),
			icon: DEFAULT_WORKSPACE_ICON,
		};

		const path = this._config.paths.default.value;
		await this.addWorkspace(path, init, true);
		await this.saveWorkspaces();
	}

	private _setLatestWorkspace(path: WorkspacePath) {
		this._workspacesConfig.set(LATEST_WORKSPACE_KEY, path);

		if (typeof window !== "undefined" && window.sessionStorage)
			window.sessionStorage.setItem(LATEST_WORKSPACE_KEY, path);

		if (getExecutingEnvironment() == "tauri") void resolveModule("setSessionData")(LATEST_WORKSPACE_KEY, path);
	}

	private _getLatestWorkspace(): WorkspacePath {
		const path = this._workspacesConfig.get(LATEST_WORKSPACE_KEY);

		if (typeof window !== "undefined" && window.sessionStorage)
			return window.sessionStorage.getItem(LATEST_WORKSPACE_KEY) || path;

		return path;
	}

	private _getAssetsPath(path: WorkspacePath): Path {
		const isStatic = getExecutingEnvironment() === "static";
		const assetsDir = isStatic ? [getBaseCatalogName(), ".gramax"] : [".workspace"];
		return new Path([path, ...assetsDir, "assets"]);
	}
}
