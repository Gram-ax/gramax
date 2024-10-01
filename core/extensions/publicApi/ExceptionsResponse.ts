import ApiResponse from "@core/Api/ApiResponse";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import SecurityRules from "@ext/security/logic/SecurityRules";

enum errorTitle {
	NotFound = "404 Not Found",
	Forbidden = "403 Forbidden",
}

class ExceptionsResponse {
	private _hidenFilter: ItemFilter;
	private _securityFilter: ItemFilter;

	constructor(private _res: ApiResponse, _context: Context) {
		this._hidenFilter = new HiddenRules().getItemFilter();
		this._securityFilter = new SecurityRules(_context.user).getItemFilter();
	}

	checkCatalogAvailability(catalog: Catalog, catalogId: string) {
		if (!catalog || !this._hidenFilter(catalog.getRootCategory(), catalog)) {
			this._res.statusCode = 404;
			const response = {
				error: errorTitle.NotFound,
				message: `Catalog with id '${catalogId}' not found`,
			};

			this._res.send(response);
			return true;
		}
		if (!this._securityFilter(catalog.getRootCategory(), catalog)) {
			this._res.statusCode = 403;
			const response = {
				error: errorTitle.Forbidden,
				message: `Catalog with id '${catalogId}' is private and access is denied.`,
			};
			this._res.send(response);
			return true;
		}
	}

	checkArticleAvailability(catalog: Catalog, catalogId: string, article: Article, articleId: string) {
		if (this.checkCatalogAvailability(catalog, catalogId)) return true;

		if (!article || !this._hidenFilter(article, catalog)) {
			this._res.statusCode = 404;
			const response = {
				error: errorTitle.NotFound,
				message: `Article with id '${articleId}' not found in catalog '${catalogId}'`,
			};
			this._res.send(response);
			return true;
		}

		if (!this._securityFilter(article, catalog)) {
			this._res.statusCode = 403;
			const response = {
				error: errorTitle.Forbidden,
				message: `Article with id '${articleId}' is private in catalog '${catalogId}' and access is denied.`,
			};
			this._res.send(response);
			return true;
		}
	}

	getResourceException(catalogId: string, articleId: string, resourcePath: string) {
		this._res.statusCode = 404;
		const response = {
			error: errorTitle.NotFound,
			message: `Resource with path '${resourcePath}' not found for article '${articleId}' in catalog '${catalogId}'`,
		};
		this._res.send(response);
		return true;
	}
}

export default ExceptionsResponse;
