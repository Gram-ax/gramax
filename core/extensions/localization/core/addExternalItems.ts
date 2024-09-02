import type Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Category } from "@core/FileStructue/Category/Category";
import type FileStructure from "@core/FileStructue/FileStructure";
import { ItemType } from "@core/FileStructue/Item/ItemType";

export const addExternalItems = (
	fromRoot: Category,
	toRoot: Category,
	fromBase: Path,
	toBase: Path,
	fs: FileStructure,
	ignore?: string[],
) => {
	const fp = fs.fp;

	const filteredFromItems = ignore
		? fromRoot.items.filter((item) => !ignore.includes(item.getFileName()))
		: fromRoot.items;

	for (let i = 0; i < toRoot.items.length; i++) {
		const item = toRoot.items[i];
		const ownerItem = filteredFromItems.find((f) => `${toBase}/${f.logicPath}` == item.logicPath);

		if (!ownerItem) {
			toRoot.items.splice(i, 1);
			continue;
		}

		item.props.order = ownerItem.props.order;
		item.props.private = ownerItem.props.private;
	}

	for (const ownerItem of filteredFromItems) {
		const itemIndex = toRoot.items.findIndex((f) => f.logicPath == `${toBase}/${ownerItem.logicPath}`);
		const item = itemIndex >= 0 && toRoot.items[itemIndex];

		const ownerPath = ownerItem.ref.path;

		const path = toBase.join(fromBase.subDirectory(ownerPath));

		if (ownerItem.type == ItemType.category) {
			let category = item as Category;
			if (!item) {
				category = new Category({
					ref: fp.getItemRef(path),
					parent: toRoot,
					content: "",
					props: { ...ownerItem.props, title: null, external: ownerItem.props.title },
					logicPath: `${toBase}/${ownerItem.logicPath}`,
					directory: path,
					items: [],
					lastModified: 0,
					fs: fs,
				});
				toRoot.items.push(category);
			}
			if (category.type == ItemType.category)
				addExternalItems(ownerItem as Category, category, fromBase, toBase, fs);
			continue;
		}

		if (!item && ownerItem.type == ItemType.article) {
			const article = new Article({
				ref: fp.getItemRef(path),
				parent: toRoot,
				props: { ...ownerItem.props, title: null, external: ownerItem.props.title },
				content: "",
				logicPath: `${toBase}/${ownerItem.logicPath}`,
				fs: fs,
				lastModified: 0,
			});

			toRoot.items.push(article);
			continue;
		}

		if (item && ownerItem.type == ItemType.article) {
			item.props.order = ownerItem.props.order;
			item.props.private = ownerItem.props.private;
			if (!item.props.title) item.props.external = ownerItem.props.title;
			continue;
		}
	}
};
