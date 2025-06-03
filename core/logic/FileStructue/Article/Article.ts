import Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type Hasher from "@core/Hash/Hasher";
import LinkResourceManager from "@core/Link/LinkResourceManager";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import { RwLock } from "@core/utils/rwlock";
import { InboxProps } from "@ext/inbox/models/types";
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

export type ArticleProps =
	| ({
			welcome?: boolean;
	  } & ItemProps)
	| InboxProps;

export const ArticlePropsKeys = ["title", "properties", "date", "author", "description", "template"] as const;

export class Article<P extends ArticleProps = ArticleProps> extends Item<P> {
	protected _fs: FileStructure;

	protected _parsedContent = RwLock.store<Content>(null);
	protected _content: string;
	protected _lastModified: number;
	private _errorCode?: number;

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

	get parsedContent() {
		return this._parsedContent;
	}

	get lastModified() {
		return this._lastModified;
	}

	get content() {
		const mutableContent = { content: this._content };
		this.events.emitSync("item-get-content", { item: this, mutableContent });
		return mutableContent.content;
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

	async updateContent(content: string, dropParsedContent = true) {
		this._content = content;
		if (dropParsedContent) await this._parsedContent.write(() => null);
		await this._save();
	}

	async rawUpdateContent(rawContent: string, dropParsedContent = true) {
		const { content, props } = this._fs.parseMarkdown(rawContent);
		this._updateProps(props);
		await this.updateContent(content, dropParsedContent);
	}

	async checkLastModified(lastModified: number): Promise<boolean> {
		const result = this._lastModified !== lastModified;
		if (result) {
			const newArticle = await this._getUpdateArticleByRead();
			this._content = newArticle._content;
			this._props = newArticle._props as P;
			await this._parsedContent.write(() => null);
		}

		return result;
	}

	getFileName(): string {
		return this._ref.path.name;
	}

	protected _updateProps(props: UpdateItemProps, additionalKeys: string[] = []) {
		const allProps = this._props as Record<string, unknown>;

		for (const key of [...ArticlePropsKeys, ...additionalKeys]) {
			if (!(key in props)) {
				delete allProps[key];
				continue;
			}

			if (Array.isArray(props[key])) {
				if (props[key]?.length) allProps[key] = props[key];
				else delete allProps[key];
			} else allProps[key] = props[key];
		}
	}

	save() {
		return this._save();
	}

	async hash(hash: Hasher, recursive = true) {
		const hasher = await super.hash(hash);
		hasher.hash(this._content);
		if (recursive) await this.parsedContent.read((p) => p.resourceManager?.hash(hash));
		return hasher;
	}

	protected async _save(renamed?: boolean) {
		delete this._props.shouldBeCreated;
		delete this._props.welcome;
		if (this._props.title?.trim()) delete this._props.external;
		await this.events.emit("item-pre-save", {
			item: this,
			mutable: { content: this._content, props: this._props },
		});
		if (this._props.title?.toString().trim()) delete this._props.external;

		const stat = await this._fs.saveArticle(this._ref.path, this._content, this._props);
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
		await this.parsedContent.write(() => newArticle.parsedContent.read());

		return this;
	}

	private async _getUpdateArticleByRead() {
		return await this._fs.createArticle(this._ref.path, this._parent);
	}

	protected _getUpdateArticleByProps(path: Path) {
		return this._fs.makeArticleByProps(path, this._props, this._content, this._parent, this._lastModified);
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
