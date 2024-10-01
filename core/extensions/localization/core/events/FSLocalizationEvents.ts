import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventArgs } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import assert from "assert";
import FileStructure, { type FSEvents } from "../../../../logic/FileStructue/FileStructure";
import { ContentLanguage } from "../model/Language";

export type FSLocalizationProps = {
	language?: ContentLanguage;
	supportedLanguages?: ContentLanguage[];
};

export const mountFSEvents = (fs: FileStructure) => {
	fs.events.on("catalog-entry-read", onCatalogEntryRead);
	fs.events.on("catalog-read", onCatalogRead);
	fs.events.on("item-created", onItemCreated);
	fs.events.on("item-deleted", onItemDeleted);
	fs.events.on("item-moved", onItemMoved);
	fs.events.on("item-props-updated", onItemPropsUpdated);
	fs.events.on("item-order-updated", onItemOrderUpdated);
	fs.events.on("item-filter", onItemFilter);
};

const onItemFilter = ({ catalogProps, item }: EventArgs<FSEvents, "item-filter">) => {
	if (!catalogProps.language || getExecutingEnvironment() != "next") return true;

	if (item.props.external && item.type == ItemType.article) return false;
	if (item.props.external && item.type == ItemType.category) {
		const hasAnyTranslatedArticle = (category: Category) =>
			category.items.some((item) => item.type == ItemType.article && !item.props.external) ||
			category.items.filter((i) => i.type == ItemType.category).some(hasAnyTranslatedArticle);
		return hasAnyTranslatedArticle(item as Category);
	}

	return true;
};

const onCatalogEntryRead = ({ entry: { props } }: EventArgs<FSEvents, "catalog-entry-read">) => {
	if (!props.language) props.language = null;
	if (!props.supportedLanguages) props.supportedLanguages = [];
	if (props.language && !props.supportedLanguages.includes(props.language))
		props.supportedLanguages.push(props.language);
};

const onCatalogRead = async ({ fs, catalog }: EventArgs<FSEvents, "catalog-read">) => {
	if (!catalog.props.language) return;

	const filters = [(item: Item) => item.type == ItemType.category];

	for (const code of Object.values(ContentLanguage)) {
		if (code == catalog.props.language) continue;

		const category = catalog.findArticle(`${catalog.getName()}/${code}`, filters) as Category;

		const hasLanguage = catalog.props.supportedLanguages.includes(code);
		let dirty = false;

		if (category && !hasLanguage) {
			console.warn(
				`'${code}' (which is language) exist but catalog not supports that language;
adding to .doc-root.yaml`,
			);

			catalog.props.supportedLanguages.push(code);
			dirty = true;
		}

		if (!category && hasLanguage) {
			console.warn(
				`category associated with '${code}' doesn't exists but catalog still supports that language;
removing from .doc-root.yaml`,
			);

			catalog.props.supportedLanguages = catalog.props.supportedLanguages.filter((l) => l != code);
			dirty = true;
		}

		if (dirty) await fs.saveCatalog(catalog);
	}
};

const onItemDeleted = async ({ catalog, ref, parser }: EventArgs<FSEvents, "item-deleted">) => {
	if (!catalog.props.language) return;
	await applyAll(catalog, ref, (ref) => catalog.deleteItem(ref, parser, true));
};

const onItemCreated = async ({ catalog, makeResourceUpdater, parentRef }: EventArgs<FSEvents, "item-created">) => {
	if (!catalog.props.language) return;
	await applyAll(catalog, parentRef, async (ref) => {
		await catalog.createArticle(makeResourceUpdater, "\n\n", ref, true);
	});
};

const onItemMoved = async ({
	catalog,
	from,
	to,
	rp,
	makeResourceUpdater,
	innerRefs,
}: EventArgs<FSEvents, "item-moved">) => {
	if (!catalog.props.language) return;

	const froms = [];
	const tos = [];

	await applyAll(catalog, from, (ref) => {
		froms.push(ref);
	});

	await applyAll(catalog, to, (ref) => {
		tos.push(ref);
	});

	assert(froms.length == tos.length, "`froms` & `tos` length must be equal");

	for (let i = 0; i < froms.length; i++) {
		await catalog.moveItem(froms[i], tos[i], makeResourceUpdater, rp, innerRefs, true);
	}
};

const onItemPropsUpdated = async ({
	catalog,
	item: originalItem,
	ref: originalRef,
	props,
	makeResourceUpdater,
}: EventArgs<FSEvents, "item-props-updated">) => {
	if (!catalog.props.language) return;

	await applyAll(catalog, originalRef, async (ref) => {
		const item = catalog.findItemByItemRef(ref);

		if (!item) {
			const msg = `Item '${ref.path.value}' (original was '${originalRef.path.value}' and now '${item.ref.path.value}') not found`;
			throw new Error(msg);
		}

		item.props.order = originalItem.order;

		await item.updateProps(
			{ ...props, title: item.props.title, description: item.props.description } as ClientArticleProps,
			makeResourceUpdater(catalog),
			catalog.getRootCategory(),
			true,
		);
	});
};

const onItemOrderUpdated = async ({ catalog, item: originalItem }: EventArgs<FSEvents, "item-order-updated">) => {
	if (!catalog.props.language) return;

	await applyAll(catalog, originalItem.ref, async (ref) => {
		const item = catalog.findItemByItemRef(ref);
		await item.setOrder(originalItem.props.order);
	});
};

const applyAll = async (catalog: Catalog, ref: ItemRef, callback: (ref: ItemRef) => void | Promise<void>) => {
	if (!ref) {
		for (const language of catalog.props.supportedLanguages) {
			if (language == catalog.props.language) continue;
			const path = catalog.getBasePath().join(new Path([language, CATEGORY_ROOT_FILENAME]));
			await callback({ path, storageId: null });
		}
		return;
	}

	const basePaths = catalog.props.supportedLanguages
		.filter((l) => l != catalog.props.language)
		.map((l) => new Path([catalog.getName(), l]));

	const isDefaultLanguage = !basePaths.some((p) => ref.path.startsWith(p));

	const resolvePath = (): [ContentLanguage, Path] => {
		const base = catalog.getBasePath().subDirectory(ref.path).value.split("/");
		const language = base.shift();
		return [ContentLanguage[language] || "", new Path(base)];
	};

	const [targetLanguage, itemPath] = isDefaultLanguage
		? [catalog.props.language, catalog.getBasePath().subDirectory(ref.path)]
		: resolvePath();

	for (const language of catalog.props.supportedLanguages) {
		if (language == targetLanguage) continue;
		const path =
			language == catalog.props.language
				? catalog.getBasePath().join(itemPath)
				: catalog.getBasePath().join(new Path(language), itemPath);

		await callback({ path, storageId: ref.storageId });
	}
};
