import ArticleFileStructure from "@core/FileStructue/Article/ArticleFileStructure";
import { FSProps } from "@core/FileStructue/FileStructure";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";
import { RenderableTreeNode } from "../../../extensions/markdown/core/render/logic/Markdoc";
import { TocItem } from "../../../extensions/navigation/article/logic/createTocItems";
import ResourceManager from "../../Resource/ResourceManager";
import { ArticleProps as ClientArticleProps } from "../../SitePresenter/SitePresenter";
import { Category } from "../Category/Category";
import { Item, ItemRef, ItemType } from "../Item/Item";

export type ArticleInitProps<FS extends ArticleFileStructure> = {
	ref: ItemRef;
	parent: Category;
	content: string;
	props: FSProps;
	logicPath: string;

	fs: FS;

	lastModified: number;
	errorCode?: number;
};

export class Article<FS extends ArticleFileStructure = ArticleFileStructure> extends Item {
	protected _fs: FS;

	private _parsedContent?: Content;
	private _content: string;
	private _errorCode?: number;
	private _lastModified: number;

	constructor({ ref, parent, props, logicPath, ...init }: ArticleInitProps<FS>) {
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

	async updateProps(props: ClientArticleProps) {
		await this._updateProps(props);
		if (this.getFileName() !== props.fileName) await this._updateArticleFileName(props.fileName);
		return this;
	}

	async checkLastModified(lastModified: number): Promise<boolean> {
		const result = this._lastModified !== lastModified;
		if (result) {
			const newArticle = await this._getUpdateArticleByRead();
			this._content = newArticle._content;
			this._props = newArticle._props;
			this._parsedContent = null;
		}

		return result;
	}

	getFileName(): string {
		return this._ref.path.name;
	}

	protected async _updateProps(props: ClientArticleProps) {
		this._props[ArticleProps.title] = props.title;
		if (props.description !== "") this._props[ArticleProps.description] = props.description;
		await this._save();
	}

	protected async _save() {
		const stat = await this._fs.saveArticle(this);
		this._lastModified = stat.mtimeMs;
		this._watcherFuncs.map((f) => f([{ itemRef: this._ref, type: FileStatus.modified }]));
	}

	private async _updateArticleFileName(fileName: string) {
		if (this.getFileName() == fileName) return;
		const path = this._ref.path.getNewName(fileName);
		await this._fs.setArticlePath(this, path);
		this._ref.path = path;
		this._logicPath = this._getUpdateArticleByProps()._logicPath;
		return this;
	}

	private async _getUpdateArticleByRead() {
		return await this._fs.createArticle(this._ref.path, this._parent, this._parent.props);
	}

	private _getUpdateArticleByProps() {
		return this._fs.makeArticleByProps(
			this._ref.path,
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
	resourceManager: ResourceManager;
}

enum ArticleProps {
	title = "title",
	description = "description",
}
