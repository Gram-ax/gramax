import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import { MarkdownExtension } from "@core/FileStructue/Item/ItemExtensions";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitDiffItemCreatorBase from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreatorBase";
import { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";

export default class GitDiffItemCreatorRevisions extends GitDiffItemCreatorBase {
	private _oldCatalog: Catalog;
	private _newCatalog: Catalog;
	constructor(
		catalog: ReadonlyCatalog,
		sp: SitePresenter,
		fs: FileStructure,
		private _oldRevision: GitVersion,
		private _newRevision: GitVersion,
		private _articleParser: ArticleParser,
	) {
		super(catalog, sp, fs);
	}

	public async getDiffItems(): Promise<{ items: DiffItem[]; resources: DiffResource[] }> {
		const catalogPath = this._catalog.basePath;
		const oldScope = GitTreeFileProvider.scoped(catalogPath, { commit: this._oldRevision.toString() });
		const newScope = GitTreeFileProvider.scoped(catalogPath, { commit: this._newRevision.toString() });
		const git = new GitCommands(this._fs.fp.default(), catalogPath);
		this._fs.fp.mount(oldScope, new GitTreeFileProvider(git));
		this._fs.fp.mount(newScope, new GitTreeFileProvider(git));
		try {
			this._oldCatalog = await this._fs.getCatalogByPath(oldScope, false);
			this._newCatalog = await this._fs.getCatalogByPath(newScope, false);
		} finally {
			this._fs.fp.unmount(oldScope);
			this._fs.fp.unmount(newScope);
		}

		return super.getDiffItems();
	}

	protected _getNewContent(path: Path, isDelete?: boolean): Promise<string> {
		if (isDelete) return Promise.resolve("");
		try {
			return this._gitVersionControl.showFileContent(path, this._newRevision);
		} catch {
			return Promise.resolve("");
		}
	}

	protected _getOldContent(path: Path, isNew?: boolean): Promise<string> {
		if (isNew) return Promise.resolve("");
		try {
			return this._gitVersionControl.showFileContent(path, this._oldRevision);
		} catch {
			return Promise.resolve("");
		}
	}

	protected _addDiffResources(changeResources: GitStatus[]): Promise<GitStatus[]> {
		return Promise.resolve(changeResources);
	}

	protected async _getOldDiffItem(changeFile: GitStatus): Promise<DiffItem> {
		const diffItem = await super._getOldDiffItem(changeFile);
		const itemRef = this._fp.getItemRef(this._oldCatalog.getItemRefPath(changeFile.path));
		const oldArticle = this._oldCatalog.findItemByItemRef<Article>(itemRef);
		diffItem.oldEditTree = await this._getEditTree(oldArticle, this._oldCatalog);
		return diffItem;
	}

	protected async _getNewOrModifiedDiffItem(changeFile: GitStatus): Promise<DiffItem> {
		if (changeFile.path.allExtensions[0] !== MarkdownExtension) return;
		const newArtilceItemRef = this._fp.getItemRef(this._newCatalog.getItemRefPath(changeFile.path));
		const newArticle = this._newCatalog.findItemByItemRef<Article>(newArtilceItemRef);
		const oldArticleItemRef = this._fp.getItemRef(this._oldCatalog.getItemRefPath(changeFile.path));
		const oldArticle = this._oldCatalog.findItemByItemRef<Article>(oldArticleItemRef);
		const content = await this._getNewContent(changeFile.path);
		return {
			type: "item",
			changeType: changeFile.status,
			title: this._fs.parseMarkdown(content).props.title,
			filePath: { path: changeFile.path.value },
			content,
			diff: await this._getDiffByPath(
				changeFile.path,
				changeFile.status === FileStatus.new,
				changeFile.status === FileStatus.delete,
			),
			oldContent: await this._getOldContent(changeFile.path, changeFile.status === FileStatus.new),
			resources: [],
			isChanged: true,
			oldEditTree:
				changeFile.status === FileStatus.new
					? undefined
					: await this._getEditTree(oldArticle, this._oldCatalog),
			newEditTree: await this._getEditTree(newArticle, this._newCatalog),
		};
	}

	protected async _getGitStatusFiles(): Promise<GitStatus[]> {
		return this._gitVersionControl.diff(this._oldRevision, this._newRevision);
	}

	private async _getEditTree(article: Article, catalog: ReadonlyCatalog): Promise<JSONContent> {
		if (!article) return null;
		if (!article.parsedContent) await this._articleParser.parse(article, catalog);
		const editTree = { ...article.parsedContent?.editTree };
		return getArticleWithTitle(article.getTitle(), editTree);
	}
}
