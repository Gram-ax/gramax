import type Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Category } from "@core/FileStructue/Category/Category";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";

export const addExternalItems = async (
	fromRoot: Category,
	toRoot: Category,
	fromBase: Path,
	toBase: Path,
	fs: FileStructure,
	ignore?: string[],
) => {
	await addExternalItemsInternal(fromRoot, toRoot, fromBase, toBase, fs, ignore);
	await saveAll(toRoot);
};

const saveAll = async (category: Category) => {
	await category.save();

	for (const item of category.items) {
		if (item.type == ItemType.category) {
			await saveAll(item as Category);
		} else {
			await item.save();
		}
	}
};

const getTargetPath = (fromBase: Path, toBase: Path, ownerItem: Item): Path => {
	const ownerPath = ownerItem.ref.path;
	return toBase.join(fromBase.subDirectory(ownerPath));
};

const getTargetLogicPath = (fromRoot: Category, toRoot: Category, ownerItem: Item): string => {
	const base = toRoot.ref.path.parentDirectoryPath.removeExtraSymbols.value;
	return `${base}${ownerItem.logicPath.substring(fromRoot.logicPath.length)}`;
};

const addExternalItemsInternal = async (
	fromRoot: Category,
	toRoot: Category,
	fromBase: Path,
	toBase: Path,
	fs: FileStructure,
	ignore?: string[],
) => {
	const fp = fs.fp;

	const filteredOwnerItems = ignore
		? fromRoot.items.filter((item) => !ignore.includes(item.getFileName()))
		: fromRoot.items;

	for (const item of toRoot.items) {
		const ownerItem = filteredOwnerItems.find((f) => getTargetLogicPath(fromRoot, toRoot, f) === item.logicPath);

		if (!ownerItem) {
			const index = toRoot.items.indexOf(item);
			if (index !== -1) {
				toRoot.items.splice(index, 1);
			}
			continue;
		}

		item.props.order = ownerItem.props.order;
		item.props.private = ownerItem.props.private;
	}

	for (const ownerItem of filteredOwnerItems) {
		const targetLogicPath = getTargetLogicPath(fromRoot, toRoot, ownerItem);
		const targetItem = toRoot.items.find((item) => item.logicPath === targetLogicPath);

		if (targetItem) {
			if (ownerItem.type === ItemType.category && targetItem.type === ItemType.category) {
				await addExternalItemsInternal(
					ownerItem as Category,
					targetItem as Category,
					ownerItem.ref.path.parentDirectoryPath,
					targetItem.ref.path.parentDirectoryPath,
					fs,
					ignore,
				);
			}
			continue;
		}

		const targetPath = getTargetPath(fromBase, toBase, ownerItem);

		if (ownerItem.type === ItemType.category) {
			const newCategory = new Category({
				ref: fp.getItemRef(targetPath),
				parent: toRoot,
				content: "",
				props: { ...ownerItem.props, title: null, external: ownerItem.props.title },
				logicPath: targetLogicPath,
				directory: targetPath,
				items: [],
				lastModified: 0,
				fs: fs,
			});
			toRoot.items.push(newCategory);

			await addExternalItemsInternal(
				ownerItem as Category,
				newCategory,
				ownerItem.ref.path.parentDirectoryPath,
				newCategory.ref.path.parentDirectoryPath,
				fs,
				ignore,
			);

			continue;
		}

		if (ownerItem.type === ItemType.article) {
			const newArticle = new Article({
				ref: fp.getItemRef(targetPath),
				parent: toRoot,
				props: { ...ownerItem.props, title: null, external: ownerItem.props.title },
				content: "",
				logicPath: targetLogicPath,
				fs: fs,
				lastModified: 0,
			});

			toRoot.items.push(newArticle);
		}
	}
};
