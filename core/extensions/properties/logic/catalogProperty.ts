import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import { Property, PropertyUsage, PropertyValue, SystemProperties } from "@ext/properties/models";

class CatalogProperty {
	private _catalogMap: Map<string, Property>;

	constructor(
		private _catalog: ContextualCatalog,
		private _resourceUpdaterFactory?: ResourceUpdaterFactory,
	) {
		this._catalogMap = new Map(
			this._catalog.props.properties
				.filter((prop) => !SystemProperties[prop.name])
				.map((prop) => [prop.name, prop]),
		);
	}

	public async getUsages(articlePath: Path, propertyName: string, values: string[]): Promise<PropertyUsage[]> {
		const articles = this._catalog.getItems().filter((article: Article) => {
			if (!article.props?.properties) return false;
			const index = article.props?.properties.findIndex((property) => property.name === propertyName);

			if (index === -1) return false;
			const newProps = { ...article.props, logicPath: article.logicPath };

			if (values) return values.some((val) => newProps.properties[index].value.includes(val));
			return true;
		});

		if (!articles.length) return;
		const curArticle = this._catalog.findItemByItemPath(articlePath);

		return await Promise.all(
			articles.map(async (article: Article) => {
				const resourcePath = curArticle.ref.path.getRelativePath(article.ref.path).value;
				return {
					title: article.getTitle(),
					resourcePath,
					linkPath: await this._catalog.getPathname(article),
				};
			}),
		);
	}

	public async update(articlePath: Path, propertyName: string, newValue: string, isDelete?: boolean) {
		const article = this._catalog.findItemByItemPath(articlePath);
		if (!article) return;

		const newProps = { ...article.props, logicPath: article.logicPath };
		if (isDelete) newProps.properties = deleteProperty(propertyName, newProps.properties);
		else newProps.properties = updateProperty(propertyName, newValue, this._catalogMap, newProps.properties);

		await this._catalog.updateItemProps(newProps, this._resourceUpdaterFactory);
	}

	public async remove(articlePath: Path, propertyName: string, value?: string[]): Promise<PropertyValue[]> {
		await Promise.all(
			this._catalog.getItems().map(async (article: Article) => {
				if (!article.props?.properties) return;
				const index = article.props?.properties.findIndex((property) => property.name === propertyName);

				if (index === -1) return;
				const newProps = { ...article.props, logicPath: article.logicPath };

				if ((value && value.some((val) => newProps.properties[index].value.includes(val))) || !value)
					newProps.properties.splice(index, 1);

				await this._catalog.updateItemProps(newProps, this._resourceUpdaterFactory);
			}),
		);

		return this._catalog.findItemByItemPath(articlePath)?.props.properties ?? [];
	}
}

export default CatalogProperty;
