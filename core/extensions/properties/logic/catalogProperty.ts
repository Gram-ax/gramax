import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { PropertyValue } from "@ext/properties/models";

class CatalogProperty {
	private _catalog: Catalog;
	private _ctx: Context;
	private _resourceUpdaterFactory: ResourceUpdaterFactory;

	constructor(catalog: Catalog, ctx: Context, resourceUpdaterFactory: ResourceUpdaterFactory) {
		this._catalog = catalog;
		this._ctx = ctx;
		this._resourceUpdaterFactory = resourceUpdaterFactory;
	}

	public async update(articlePath: string, propertyName: string, newValue: string) {
		const article = this._catalog.findItemByItemPath(new Path(articlePath));
		if (!article) return;
		const newProps = { ...article.props, logicPath: article.logicPath };
		const propertyID = newProps.properties.findIndex((property) => property.name === propertyName);

		if (propertyID === -1) return;
		newProps.properties[propertyID].value = [newValue];

		await this._catalog.updateItemProps(newProps, this._resourceUpdaterFactory.withContext(this._ctx));
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

				await this._catalog.updateItemProps(newProps, this._resourceUpdaterFactory.withContext(this._ctx));
			}),
		);

		return this._catalog.findItemByItemPath(articlePath)?.props.properties ?? [];
	}
}

export default CatalogProperty;
