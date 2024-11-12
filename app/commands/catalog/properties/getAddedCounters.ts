import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Property } from "@ext/properties/models";

const getAddedCounters: Command<{ catalogName: string; articlePath: Path }, Property[]> = Command.create({
	path: "catalog/actionEditorProperties/getAddedCounters",

	kind: ResponseKind.json,

	middlewares: [new ReloadConfirmMiddleware()],

	async do({ catalogName, articlePath }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);
		const curArticle = catalog.findItemByItemPath<Article>(itemRef.path);
		const allArticles = catalog.getArticles();
		const allProps = catalog.props.properties;

		return allArticles
			.flatMap((article) => {
				if (article.logicPath === curArticle.logicPath) return [];

				return article.props.properties
					?.map((prop) => {
						const originalProp = allProps.find((catProp) => catProp.name === prop.name);

						if (!originalProp) return null;

						return {
							...originalProp,
							value: prop.value,
						};
					})
					.filter(Boolean);
			})
			.filter(Boolean);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.curArticlePath);
		return { ctx, catalogName, articlePath };
	},
});

export default getAddedCounters;
