import Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type Hasher from "@core/Hash/Hasher";
import LinkResourceManager from "@core/Link/LinkResourceManager";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";
import { RenderableTreeNode } from "../../../extensions/markdown/core/render/logic/Markdoc";
import { TocItem } from "../../../extensions/navigation/article/logic/createTocItems";
import ResourceManager from "../../Resource/ResourceManager";
import { Category } from "../Category/Category";
import { Item, UpdateItemProps, type ItemEvents, type ItemProps } from "../Item/Item";

export type ArticleEvents = ItemEvents;

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

	get events() {
		return super.events;
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

	protected override _updateProps(props: UpdateItemProps) {
		this._props.title = props.title;
		if (props.properties?.length) this._props.properties = props.properties;
		else delete this._props.properties;

		if (props.description !== "") this._props.description = props.description;
	}

	save() {
		return this._save();
	}

	async hash(hash: Hasher, recursive = true) {
		const hasher = await super.hash(hash);
		hasher.hash(this._content);
		if (recursive) await this.parsedContent?.resourceManager?.hash(hash);
		return hasher;
	}

	protected async _save(renamed?: boolean) {
		delete this._props.shouldBeCreated;
		delete this._props.welcome;
		if (this._props.title?.trim()) delete this._props.external;
		const stat = await this._fs.saveArticle(this);
		this._lastModified = stat.mtimeMs;
		await this.events.emit("item-changed", { item: this, status: renamed ? FileStatus.new : FileStatus.modified });
	}

	protected override async _updateFilename(fileName: string, resourceUpdater: ResourceUpdater) {
		if (this.getFileName() == fileName) return;
		let path = this._ref.path.getNewName(fileName);
		if (await this._fs.fp.exists(path)) {
			const readdir = await this._fs.fp.getItems(this.ref.path.parentDirectoryPath);
			path = createNewFilePathUtils.create(
				this.ref.path,
				readdir.map((s) => s.path),
				fileName,
			);
		}
		await this._fs.moveArticle(this, path);
		const newArticle = this._getUpdateArticleByProps(path);
		await resourceUpdater.update(this, newArticle);
		this._logicPath = newArticle.logicPath;
		this._ref = newArticle.ref;
		this._content = newArticle._content;
		this.parsedContent = newArticle.parsedContent;

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
	icons: Set<string>;
	linkManager: LinkResourceManager;
	resourceManager: ResourceManager;
}
