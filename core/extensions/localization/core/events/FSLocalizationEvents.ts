import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventArgs, UnsubscribeToken } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { addExternalItems } from "@ext/localization/core/addExternalItems";
import assert from "assert";
import FileStructure, { type FSEvents } from "../../../../logic/FileStructue/FileStructure";
import { ContentLanguage } from "../model/Language";

export type FSLocalizationProps = {
	language?: ContentLanguage;
	supportedLanguages?: ContentLanguage[];
};

export default class FSLocalizationEvents implements EventHandlerCollection {
	// For some reason we need to save unsubscribe token address from "catalog-read" event and maybe other events
	private _unsubribeTokens: UnsubscribeToken[] = [];
	constructor(private _fs: FileStructure) {}

	mount(): void {
		this._unsubribeTokens.push(
			this._fs.events.on("catalog-entry-read", this.onCatalogEntryRead.bind(this)),
			this._fs.events.on("catalog-read", this.onCatalogRead.bind(this)),
			this._fs.events.on("item-created", this.onItemCreated.bind(this)),
			this._fs.events.on("item-deleted", this.onItemDeleted.bind(this)),
			this._fs.events.on("item-moved", this.onItemMoved.bind(this)),
			this._fs.events.on("item-props-updated", this.onItemPropsUpdated.bind(this)),
			this._fs.events.on("item-order-updated", this.onItemOrderUpdated.bind(this)),
			this._fs.events.on("item-filter", this.onItemFilter.bind(this)),
		);
	}

	private onItemFilter = ({ catalogProps, item }: EventArgs<FSEvents, "item-filter">) => {
		if (!catalogProps.language || getExecutingEnvironment() === "browser" || getExecutingEnvironment() === "tauri")
			return true;

		if (item.props.external && item.type == ItemType.article) return false;
		if (item.props.external && item.type == ItemType.category) {
			const hasAnyTranslatedArticle = (category: Category) =>
				category.items.some((item) => item.type == ItemType.article && !item.props.external) ||
				category.items.filter((i) => i.type == ItemType.category).some(hasAnyTranslatedArticle);
			return hasAnyTranslatedArticle(item as Category);
		}

		return true;
	};

	private onCatalogEntryRead = ({ entry: { props } }: EventArgs<FSEvents, "catalog-entry-read">) => {
		if (!props.language) props.language = null;
		if (!props.supportedLanguages) props.supportedLanguages = [];
		if (props.language && !props.supportedLanguages.includes(props.language))
			props.supportedLanguages.push(props.language);
	};

	private onCatalogRead = async ({ fs, catalog }: EventArgs<FSEvents, "catalog-read">) => {
		if (!catalog.props.language || catalog.isFpReadOnly) return;

		const filters = [(item: Item) => item.type == ItemType.category];

		for (const code of Object.values(ContentLanguage)) {
			if (code == catalog.props.language) continue;

			const category = catalog.findArticle(`${catalog.name}/${code}`, filters) as Category;

			const hasLanguage = catalog.props.supportedLanguages.includes(code);
			let dirty = false;

			if (category && !hasLanguage) {
				const msg = `'${code}' (which is language) exist but catalog not supports that language; adding to .doc-root.yaml`;
				console.warn(msg);

				catalog.props.supportedLanguages.push(code);
				dirty = true;
			}

			if (!category && hasLanguage) {
				const msg = `category associated with '${code}' doesn't exists but catalog still supports that language; removing from .doc-root.yaml`;
				console.warn(msg);

				catalog.props.supportedLanguages = catalog.props.supportedLanguages.filter((l) => l != code);
				dirty = true;
			}

			if (dirty) await fs.saveCatalog(catalog);
		}
	};

	private onItemDeleted = async ({ catalog, ref, parser }: EventArgs<FSEvents, "item-deleted">) => {
		if (!catalog.props.language) return;
		await this.applyAll(catalog, false, ref, (ref) => catalog.deleteItem(ref, parser, true));
	};

	private onItemCreated = async ({
		catalog,
		makeResourceUpdater,
		parentRef,
	}: EventArgs<FSEvents, "item-created">) => {
		if (!catalog.props.language) return;
		await this.applyAll(catalog, false, parentRef, async (ref) => {
			await catalog.createArticle(makeResourceUpdater, "\n\n", ref, true);
		});
	};

	private onItemMoved = async ({
		catalog,
		from,
		to,
		makeResourceUpdater,
		innerRefs,
	}: EventArgs<FSEvents, "item-moved">) => {
		if (!catalog.props.language) return;

		const froms = [];
		const tos = [];

		await this.applyAll(catalog, false, from, (ref) => {
			froms.push(ref);
		});

		await this.applyAll(catalog, false, to, (ref) => {
			tos.push(ref);
		});

		assert(froms.length == tos.length, "`froms` & `tos` length must be equal");

		for (let i = 0; i < froms.length; i++) {
			await catalog.moveItem(froms[i], tos[i], makeResourceUpdater, innerRefs, true);
		}
	};

	private onItemPropsUpdated = async ({
		catalog,
		item: originalItem,
		ref: originalRef,
		props,
		makeResourceUpdater,
	}: EventArgs<FSEvents, "item-props-updated">) => {
		if (!catalog.props.language) return;

		await this.applyAll(catalog, true, originalRef, async (ref, item) => {
			if (!item) {
				const msg = `Item '${ref.path.value}' (original was '${originalRef.path.value}') not found`;
				throw new Error(msg);
			}

			item.props.order = originalItem.order;
			if (!item.props.title?.trim()) item.props.external = originalItem.props.title;

			await item.updateProps(
				{
					...props,
					title: item.props.title,
					description: item.props.description,
				},
				makeResourceUpdater(catalog),
				catalog,
				true,
			);
		});
	};

	private onItemOrderUpdated = async ({ catalog, item: originalItem }: EventArgs<FSEvents, "item-order-updated">) => {
		if (!catalog.props.language) return;

		await this.applyAll(catalog, true, originalItem.ref, async (ref, item) => {
			await item.setOrder(originalItem.props.order, true);
		});
	};

	private applyAll = async (
		catalog: Catalog,
		check: boolean,
		originalRef: ItemRef,
		callback: (ref: ItemRef, item: Item) => void | Promise<void>,
	) => {
		if (!originalRef) {
			const rootCategoryPath = catalog.getRootCategoryPath();

			for (const language of catalog.props.supportedLanguages) {
				if (language == catalog.props.language) continue;
				const path = rootCategoryPath.join(new Path([language, CATEGORY_ROOT_FILENAME]));
				await callback({ path, storageId: null }, null);
			}
			return;
		}

		const rootCategoryPath = catalog.getRootCategoryPath();

		const basePaths = catalog.props.supportedLanguages
			.filter((l) => l != catalog.props.language)
			.map((l) => rootCategoryPath.join(new Path(l)));

		const isDefaultLanguage = !basePaths.some((p) => originalRef.path.startsWith(p));

		const resolvePath = (): [ContentLanguage, Path] => {
			const relativePath = rootCategoryPath.subDirectory(originalRef.path);
			assert(
				relativePath,
				`cannot resolve relative path for ${originalRef.path.value} from root ${rootCategoryPath.value}`,
			);

			const base = relativePath.value.split("/");
			const language = base.shift();
			return [ContentLanguage[language] || "", new Path(base)];
		};

		let targetLanguage: ContentLanguage;
		let itemPath: Path;

		if (isDefaultLanguage) {
			targetLanguage = catalog.props.language;
			itemPath = rootCategoryPath.subDirectory(originalRef.path);
			assert(
				itemPath,
				`cannot resolve item path for ${originalRef.path.value} from root ${rootCategoryPath.value}`,
			);
		} else {
			[targetLanguage, itemPath] = resolvePath();
		}

		// language categories has theirs own _index.md files (e.g. en/_index.md) while root category uses .doc-root.yml
		//  and have no any related props, so we need to skip them
		const skipPath = new Path([catalog.name, targetLanguage, CATEGORY_ROOT_FILENAME]);
		const skip = originalRef.path.startsWith(skipPath);

		for (const language of catalog.props.supportedLanguages) {
			if (language == targetLanguage) continue;

			const path =
				language == catalog.props.language
					? rootCategoryPath.join(itemPath)
					: rootCategoryPath.join(new Path(language), itemPath);

			const ref = { path, storageId: originalRef.storageId };
			let item = catalog.findItemByItemRef(ref);

			if (!item && language == catalog.props.language && skip) continue;

			if (!item && check) {
				let languageCategoryName = catalog.name;
				if (catalog.props.language != language) languageCategoryName += "/" + language;

				const languageCategory = catalog.findArticle(languageCategoryName, []) as Category;

				if (!languageCategory) continue;

				await addExternalItems(
					catalog.getRootCategory(),
					languageCategory,
					catalog.getRootCategory().folderPath,
					languageCategory.folderPath,
					this._fs,
					catalog.props.supportedLanguages,
				);

				await catalog.update();

				item = catalog.findItemByItemRef(ref);
			}

			await callback(ref, item);
		}
	};
}
