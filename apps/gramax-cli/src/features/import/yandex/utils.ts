import { join, resolve } from "path";

export const getChildrenByRequestChildren = (data: any) => {
	if (!data || !data.children || !data.children.results) return;

	return data.children.results;
};

class InternalPathClass {
	private _pathToOut: string;
	private _pathToContent: string;

	constructor() {
		this.init(process.cwd());
	}

	init(pathToDistDir: string) {
		this._pathToOut = resolve(pathToDistDir, "out");
		this._pathToContent = join(this._pathToOut, "yandex-wiki-catalog");
	}

	get pathToOut() {
		return this._pathToOut;
	}

	get pathToContent() {
		return this._pathToContent;
	}
}

export const InternalPath = new InternalPathClass();
