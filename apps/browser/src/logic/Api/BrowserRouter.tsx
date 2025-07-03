import Url from "@core-ui/ApiServices/Types/Url";
import Query, { parserQuery } from "@core/Api/Query";
import { Router, RouterRule } from "@core/Api/Router";
import { navigate } from "wouter/use-browser-location";
import useLocation from "./useLocation";

export default class BrowserRouter extends Router {
	private _route: string;

	private constructor(
		path: string,
		private _query: Query,
		private _setPath: (path: string, opts?: { replace?: boolean }) => void,
		rules: RouterRule[],
	) {
		super(rules);
		this._route = path.split("?", 1)[0];
	}

	get basePath(): string {
		return this._route;
	}

	get query(): Query {
		return this._query;
	}

	get path(): string {
		return this._route;
	}

	get hash(): string {
		return typeof window === "undefined" ? "" : encodeURI(window.location.hash ?? "");
	}

	pushQuery(query: Query) {
		this._setPath(Url.fromBasePath("", this._route, query).toString());
		return this;
	}

	pushPath(path: string): this {
		const transformed = this._transform(path);
		this._setPath(transformed);
		return this;
	}

	static use(rules: RouterRule[]): Router {
		const [path, , query] = useLocation();
		return new BrowserRouter(path, parserQuery(query), navigate, rules);
	}
}
