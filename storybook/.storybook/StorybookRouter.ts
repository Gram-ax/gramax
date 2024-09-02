import Query from "@core/Api/Query";
import { Router } from "@core/Api/Router";

export default class StorybookRouter extends Router {
	get basePath(): string {
		return "";
	}
	get query(): Query {
		return {};
	}
	get hash(): string {
		return "";
	}
	get path(): string {
		return "";
	}
	pushQuery(query: Query): this {
		console.log("push query", query);
		return this;
	}
	pushPath(path: string): this {
		console.log("push path", path);
		return this;
	}
	static use() {
		return new StorybookRouter([]);
	}
}
