import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import type { CommitScope, DiffCompareOptions, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import RevisionDiffItemCreator from "@ext/git/core/GitDiffItemCreator/RevisionDiffItemCreator";
import RevisionDiffTreePresenter, { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import Navigation from "@ext/navigation/catalog/main/logic/Navigation";

export default class DiffTreeCreator {
	private _gvc: GitVersionControl;

	constructor(
		private _fs: FileStructure,
		private _sp: SitePresenter,
		private _catalog: Catalog,
		private _oldScope: TreeReadScope,
		private _newScope?: TreeReadScope,
	) {
		this._gvc = this._catalog.repo.gvc;
	}

	async getDiffTree(): Promise<DiffTree> {
		await this._gitIndexAddInDesktop();

		const { oldCatalog, newCatalog, diffOpts } = await this._getScopedCatalogsAndDiffOpts();

		const gitDiffItemCreator = new RevisionDiffItemCreator(
			this._catalog,
			this._sp,
			this._fs,
			diffOpts,
			oldCatalog,
			newCatalog,
		);

		const diffItems = await gitDiffItemCreator.getDiffItems();

		const nav = new Navigation();
		const diffTreePresenter = new RevisionDiffTreePresenter({
			diffItems,
			newRoot: newCatalog.name,
			oldRoot: oldCatalog.name,
			newItems: await nav.getCatalogNav(newCatalog, null),
			oldItems: await nav.getCatalogNav(oldCatalog, null),
		});

		return diffTreePresenter.present();
	}

	private async _gitIndexAddInDesktop() {
		const isBrowser = getExecutingEnvironment() === "browser";
		if (!isBrowser) await this._gvc.add();
	}

	private async _getScopedCatalogsAndDiffOpts(): Promise<{
		oldCatalog: ReadonlyCatalog;
		newCatalog: ReadonlyCatalog;
		diffOpts: DiffCompareOptions;
	}> {
		const oldCommitScope = await convertScopeToCommitScope(this._oldScope, this._gvc);
		const newCommitScope = await convertScopeToCommitScope(this._newScope, this._gvc);

		if (!newCommitScope) {
			return {
				newCatalog: this._catalog,
				oldCatalog: await this._getCatalog(oldCommitScope),
				diffOpts: { type: "index", tree: oldCommitScope.commit },
			};
		}

		return {
			newCatalog: await this._getCatalog(newCommitScope),
			oldCatalog: await this._getCatalog(oldCommitScope),
			diffOpts: { type: "tree", new: newCommitScope.commit, old: oldCommitScope.commit },
		};
	}

	private async _getCatalog(commitScope: CommitScope): Promise<ReadonlyCatalog> {
		if (!commitScope) return this._catalog;
		return this._catalog.repo.scopedCatalogs.getScopedCatalog(this._catalog.basePath, this._fs, commitScope);
	}
}
