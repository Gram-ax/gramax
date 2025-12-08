import Url from "../../ui-logic/ApiServices/Types/Url";
import Query from "./Query";

export type RouterRule = (path: string, prev: string) => string;

export abstract class Router {
	constructor(private _rules: RouterRule[]) {}

	abstract get basePath(): string;
	abstract get query(): Query;
	abstract get hash(): string;
	abstract get path(): string;
	abstract pushQuery(query: Query): this;
	abstract pushPath(path: string): this;
	abstract setUrl(url: Url): this;

	protected _transform(path: string) {
		return this._rules.reduce(([prev, path], rule) => [path, rule(path, prev)], [this.path, path])[1];
	}
}
