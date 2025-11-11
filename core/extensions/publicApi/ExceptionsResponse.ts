import ApiResponse from "@core/Api/ApiResponse";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import SecurityRules from "@ext/security/logic/SecurityRules";

export enum ErrorTitle {
	NotFound = "404 Not Found",
	Forbidden = "403 Forbidden",
	Unauthorized = "401 Unauthorized",
}

const validataionTokenErrorMessages = {
	"Invalid token": "Invalid token. Please provide a valid authentication token.",
	"Token has expired": "Token has expired. Please refresh your token.",
};

class ExceptionsResponse {
	private _hidenFilter: ItemFilter;
	private _securityFilter: ItemFilter;

	constructor(private _res: ApiResponse, context?: Context) {
		if (!context) return;
		this._hidenFilter = new HiddenRules(null).getItemFilter();
		this._securityFilter = new SecurityRules(context.user).getItemFilter();
	}

	checkCatalogAvailability(catalog: ReadonlyCatalog, catalogId: string) {
		if (!catalog || !this._hidenFilter(catalog.getRootCategory(), catalog)) {
			this._res.statusCode = 404;
			const response = {
				error: ErrorTitle.NotFound,
				message: `Catalog with id '${catalogId}' not found`,
			};

			this._res.send(response);
			return true;
		}
		if (!this._securityFilter(catalog.getRootCategory(), catalog)) {
			this._res.statusCode = 403;
			const response = {
				error: ErrorTitle.Forbidden,
				message: `Catalog with id '${catalogId}' is private and access is denied.`,
			};
			this._res.send(response);
			return true;
		}
	}

	checkArticleAvailability(catalog: ReadonlyCatalog, catalogId: string, article: Article, articleId: string) {
		if (this.checkCatalogAvailability(catalog, catalogId)) return true;

		if (!article || !this._hidenFilter(article, catalog)) {
			this._res.statusCode = 404;
			const response = {
				error: ErrorTitle.NotFound,
				message: `Article with id '${articleId}' not found in catalog '${catalogId}'.`,
			};
			this._res.send(response);
			return true;
		}

		if (!this._securityFilter(article, catalog)) {
			this._res.statusCode = 403;
			const response = {
				error: ErrorTitle.Forbidden,
				message: `Article with id '${articleId}' is private in catalog '${catalogId}' and access is denied.`,
			};
			this._res.send(response);
			return true;
		}
	}

	getResourceException(catalogId: string, articleId: string, resourcePath: string) {
		this._res.statusCode = 404;
		const response = {
			error: ErrorTitle.NotFound,
			message: `Resource with path '${resourcePath}' not found for article '${articleId}' in catalog '${catalogId}'.`,
		};
		this._res.send(response);
		return true;
	}

	getValidataionTokenException(message: string) {
		this._res.statusCode = 401;
		const response = {
			error: ErrorTitle.Unauthorized,
			message: validataionTokenErrorMessages[message],
		};
		this._res.send(response);
	}
}

export default ExceptionsResponse;
