import Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";
import { RenderableTreeNode } from "../../../extensions/markdown/core/render/logic/Markdoc";
import { TocItem } from "../../../extensions/navigation/article/logic/createTocItems";
import ResourceManager from "../../Resource/ResourceManager";
import { ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Category } from "../Category/Category";
import { Item, type ItemProps } from "../Item/Item";

export type ArticleInitProps<P extends ItemProps> = {
	ref: ItemRef;
	parent: Category;
	content: string;
	props: P;
	logicPath: string;

	fs: FileStructure;

	lastModified: number;
	errorCode?: number;
};

export type ArticleProps = {
	welcome?: boolean;
} & ItemProps;

export class Article<P extends ArticleProps = ArticleProps> extends Item<P> {
	protected _fs: FileStructure;

	private _parsedContent?: Content;
	private _content: string;
	private _errorCode?: number;
	private _lastModified: number;

	constructor({ ref, parent, props, logicPath, ...init }: ArticleInitProps<P>) {
		super(ref, parent, props, logicPath);
		this._content = init.content;
		this._errorCode = init.errorCode;
		this._lastModified = init.lastModified;
		this._fs = init.fs;
	}

	set parsedContent(parsedContent: Content) {
		this._parsedContent = parsedContent;
	}

	get parsedContent() {
		return this._parsedContent;
	}

	get content() {
		return this._content;
	}

	get type() {
		return ItemType.article;
	}

	get errorCode(): number {
		return this._errorCode;
	}

	set errorCode(value: number) {
		this._errorCode = value;
	}

	async updateContent(content: string) {
		this._content = content;
		this._parsedContent = null;
		await this._save();
	}

	async updateProps(props: ClientArticleProps, resourceUpdater: ResourceUpdater) {
		await this._updateProps(props);
		await this._updateArticleFileName(props.fileName, resourceUpdater);
		return this;
	}

	async checkLastModified(lastModified: number): Promise<boolean> {
		const result = this._lastModified !== lastModified;
		if (result) {
			const newArticle = await this._getUpdateArticleByRead();
			this._content = newArticle._content;
			this._props = newArticle._props as P;
			this._parsedContent = null;
		}

		return result;
	}

	getFileName(): string {
		return this._ref.path.name;
	}

	protected async _updateProps(props: ClientArticleProps) {
		this._props.title = props.title;
		if (props.description !== "") this._props.description = props.description;
		await this._save();
	}

	save() {
		return this._save();
	}

	protected async _save() {
		delete this._props.welcome;
		const stat = await this._fs.saveArticle(this);
		this._lastModified = stat.mtimeMs;
		this._watcherFuncs.map((f) => f([{ itemRef: this._ref, type: FileStatus.modified }]));
	}

	private async _updateArticleFileName(fileName: string, resourceUpdater: ResourceUpdater) {
		if (this.getFileName() == fileName) return;
		const path = this._ref.path.getNewName(fileName);
		await this._fs.moveArticle(this, path);
		const newArticle = this._getUpdateArticleByProps(path);
		await resourceUpdater.update(this, newArticle);
		Object.assign(this, newArticle);
		return this;
	}

	private async _getUpdateArticleByRead() {
		return await this._fs.createArticle(this._ref.path, this._parent, this._parent.props);
	}

	private _getUpdateArticleByProps(path: Path) {
		return this._fs.makeArticleByProps(
			path,
			this._props,
			this._content,
			this._parent,
			this._parent.props,
			this._lastModified,
		);
	}
}

export interface Content {
	htmlValue: string;
	tocItems: TocItem[];
	editTree: JSONContent;
	renderTree: RenderableTreeNode;
	snippets: Set<string>;
	linkManager: ResourceManager;
	resourceManager: ResourceManager;
}
