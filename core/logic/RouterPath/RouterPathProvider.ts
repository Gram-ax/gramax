import Path from "@core/FileProvider/Path/Path";
import PathnameData from "@core/RouterPath/model/PathnameData";
import { ContentLanguage } from "@ext/localization/core/model/Language";

export default class RouterPathProvider {
	private static readonly _separator = "-";

	static getLogicPath(pathname: string) {
		return this.isEditorPathname(pathname)
			? new Path(this.parsePath(new Path(pathname)).itemLogicPath).value
			: pathname;
	}

	static parsePath(path: string[] | string | Path): PathnameData {
		const pathSegments = this._getArrayOfStrings(path);
		const currentPath = this.isEditorPathname(pathSegments)
			? pathSegments
			: this._getArrayOfStrings(this.getPathname({ itemLogicPath: pathSegments }));

		const [sourceName, group, repo, refname, dir, maybeLanguage, ...filePath] = currentPath.map((p) =>
			p === this._separator ? undefined : p,
		);

		const language = ContentLanguage[maybeLanguage];
		maybeLanguage && filePath.unshift(maybeLanguage);
		const normalizedFilePath = filePath.map((x) => decodeURIComponent(x));
		const catalogName = dir ?? repo;
		const itemLogicPath = [catalogName, ...normalizedFilePath];
		const repNameItemLogicPath = repo ? [repo, ...normalizedFilePath] : undefined;

		const hash = catalogName?.match(/^(.+?)(#.+)?$/)?.[2] ?? "";

		return {
			sourceName: sourceName ? decodeURIComponent(sourceName) : undefined,
			group: group ? decodeURIComponent(group) : undefined,
			repo: repo,
			refname: refname ? decodeURIComponent(refname) : undefined,
			catalogName,
			language,
			filePath: normalizedFilePath,
			itemLogicPath,
			repNameItemLogicPath,
			hash,
		};
	}

	static getPathname(data: PathnameData): Path {
		const hasItemLogicPath = data.itemLogicPath?.length > 0;
		const hasFilePath = data.filePath?.length > 0;
		let catalogName = data.catalogName ?? (hasItemLogicPath ? data.itemLogicPath[0] : null);
		const filePath = hasFilePath
			? new Path(data.filePath).value
			: hasItemLogicPath
			? new Path(data.itemLogicPath.slice(1)).value
			: null;
		catalogName = catalogName === data.repo ? this._separator : catalogName;

		return new Path([
			data.sourceName ? encodeURIComponent(data.sourceName) : this._separator,
			data.group ? encodeURIComponent(data.group) : this._separator,
			data.repo ?? this._separator,
			data.refname ? encodeURIComponent(data.refname) : this._separator,
			catalogName,
			filePath,
		]);
	}

	static parseItemLogicPath(itemLogicPath: string[] | Path): {
		catalogName: string;
		filePath: string[];
		fullPath: string[];
	} {
		const fullPath = this._getArrayOfStrings(itemLogicPath);
		const [catalogName, ...filePath] = fullPath;
		return { catalogName, filePath, fullPath };
	}

	static isEditorPathname(path: string[] | string | Path): boolean {
		const currentPath = this._getArrayOfStrings(path);
		return (currentPath[0]?.includes(".") || currentPath[0] == this._separator) && !currentPath[0]?.includes(":");
	}

	static updatePathnameData(
		basePathname: PathnameData | string[] | string | Path,
		newPathnameData: PathnameData,
	): Path {
		const pathnameData =
			basePathname instanceof Array || basePathname instanceof Path || typeof basePathname === "string"
				? this.parsePath(basePathname)
				: basePathname;
		return this.getPathname({ ...pathnameData, ...newPathnameData });
	}

	static validate(pathdata: PathnameData): boolean {
		return !!(pathdata.sourceName && pathdata.group && pathdata.repo);
	}

	static isLocal(pathdata: PathnameData): boolean {
		return !pathdata.sourceName && !pathdata.group && !pathdata.repo;
	}

	private static _getArrayOfStrings(path: string[] | string | Path): string[] {
		return path instanceof Array
			? path
			: path
					.toString()
					.split("/")
					.filter((f) => f !== "");
	}
}
