import { join, resolve, basename } from "path";
import { Resource } from "./entities/article";

export const getChildrenByRequestChildren = (data: any) => {
	if (!data || !data.children || !data.children.results) return;

	return data.children.results;
};

class InternalPathClass {
	private _pathToOutDir: string;
	private _pathToContentDir: string;

	constructor() {
		this.init(process.cwd());
	}

	init(pathToDistDir: string) {
		this._pathToOutDir = resolve(pathToDistDir, "out");
		this._pathToContentDir = join(this._pathToOutDir, "yandex-wiki-catalog");
	}

	get pathToOutDir() {
		return this._pathToOutDir;
	}

	get pathToContentDir() {
		return this._pathToContentDir;
	}
}

export const getHttpSrc = (src: string): string => src.replace(/\\/g, "/").replace(/\/{2,}/g, "/");

export const InternalPath = new InternalPathClass();
export const getPathsFromMdLink = (resource: Resource, articleName: string) => {
	const { src, slug } = resource;
	const fileName = articleName + "-" + basename(src);

	const folderPath = slug;
	const folderPathToHasChildren = folderPath.split("/").filter(Boolean).join("/");
	const folderPathWithoutHasChildren = folderPath.split("/").filter(Boolean).slice(0, -1).join("/");

	const httpSrc = getHttpSrc(src);

	return {
		fileName,
		folderPathToHasChildren,
		folderPathWithoutHasChildren,
		src: src.split("/").filter(Boolean).join("/"),
		httpSrc,
	};
};

export const getPathBySlug = (slug: string, fileName: string, hasChildren: boolean) => {
	const pathToArticleFolder = hasChildren ? slug : slug.split("/").filter(Boolean).slice(0, -1).join("/");
	const filePath = join(pathToArticleFolder, fileName);

	return { filePath };
};

export function hasHttp(url: string) {
	return /^(https?:\/\/)/.test(url);
}
