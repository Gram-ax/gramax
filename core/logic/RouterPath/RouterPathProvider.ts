import Path from "@core/FileProvider/Path/Path";
import type PathnameData from "@core/RouterPath/model/PathnameData";
import { ContentLanguage } from "@ext/localization/core/model/Language";

class RouterPathProvider {
	private static readonly _separator = "-";
	private static readonly _readonlyPathPrefix = "/";

	static getLogicPath(pathname: string) {
		return RouterPathProvider.isEditorPathname(pathname)
			? new Path(RouterPathProvider.parsePath(new Path(pathname)).itemLogicPath).value
			: pathname.startsWith(RouterPathProvider._readonlyPathPrefix)
				? pathname.substring(1)
				: pathname;
	}

	static getReadOnlyPathname(ligicPath: string) {
		return `${RouterPathProvider._readonlyPathPrefix}${ligicPath}`;
	}

	static parsePath(path: string[] | string | Path): PathnameData {
		const segments = RouterPathProvider._parseSegments(path);

		let isPublic = false;
		if (segments[0] === "public") {
			isPublic = true;
			segments.shift();
		}

		const [sourceName, group, repo, refname, dir, maybeLanguage, ...filePath] = segments;

		const language = ContentLanguage[maybeLanguage];
		maybeLanguage && filePath.unshift(maybeLanguage);
		const normalizedFilePath = filePath.map((x) => decodeURIComponent(x));
		const catalogName = dir ?? repo ?? RouterPathProvider._separator;
		const itemLogicPath = [catalogName, ...normalizedFilePath];
		const repNameItemLogicPath = repo ? [repo, ...normalizedFilePath] : null;

		const hash = catalogName?.split("#", 1)?.[1] ?? "";

		return {
			sourceName: sourceName ? decodeURIComponent(sourceName) : null,
			group: group ? decodeURIComponent(group) : null,
			repo: repo,
			refname: refname ? decodeURIComponent(refname) : null,
			catalogName: catalogName === RouterPathProvider._separator ? null : catalogName,
			language,
			filePath: normalizedFilePath,
			itemLogicPath,
			repNameItemLogicPath,
			hash,
			isPublic,
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
		catalogName = catalogName === data.repo ? RouterPathProvider._separator : catalogName;

		return new Path([
			data.sourceName ? encodeURIComponent(data.sourceName) : RouterPathProvider._separator,
			data.group ? encodeURIComponent(data.group) : RouterPathProvider._separator,
			data.repo ?? RouterPathProvider._separator,
			data.refname ? encodeURIComponent(data.refname) : RouterPathProvider._separator,
			catalogName,
			filePath,
		]);
	}

	static parseItemLogicPath(itemLogicPath: string[] | Path): {
		catalogName: string;
		filePath: string[];
		fullPath: string[];
	} {
		const fullPath = RouterPathProvider._getArrayOfStrings(itemLogicPath);
		const [catalogName, ...filePath] = fullPath;
		return { catalogName, filePath, fullPath };
	}

	static isEditorPathname(path: string[] | string | Path): boolean {
		const currentPath = RouterPathProvider._getArrayOfStrings(path);
		const exclude = ["public"];
		const offset = exclude.includes(currentPath[0]) ? 1 : 0;

		const maybeStorage = decodeURIComponent(currentPath[0 + offset]);
		const maybeSeparator = currentPath
			.slice(1 + offset, 4 + offset)
			.some((s) => s === RouterPathProvider._separator);

		const isEditorPathname =
			(maybeStorage?.includes(".") || maybeSeparator || maybeStorage.startsWith("localhost")) &&
			(!maybeStorage?.includes(":") || /^.*:\d+$/.test(maybeStorage));

		return isEditorPathname;
	}

	static updatePathnameData(
		basePathname: PathnameData | string[] | string | Path,
		newPathnameData: PathnameData,
	): Path {
		const pathnameData =
			basePathname instanceof Array || basePathname instanceof Path || typeof basePathname === "string"
				? RouterPathProvider.parsePath(basePathname)
				: basePathname;
		return RouterPathProvider.getPathname({ ...pathnameData, ...newPathnameData });
	}

	static validate(pathdata: PathnameData): boolean {
		return !!(pathdata.sourceName && pathdata.group && pathdata.repo);
	}

	static isLocal(pathdata: PathnameData): boolean {
		return !pathdata.sourceName && !pathdata.group && !pathdata.repo;
	}

	private static _getArrayOfStrings(path: string[] | string | Path): string[] {
		const exclude = ["http:", "https:"];

		const arr =
			path instanceof Array
				? path
				: path
						.toString()
						.split("/")
						.filter((f) => f !== "");

		if (exclude.includes(arr[0])) arr[0] = null;
		if (exclude.includes(arr[1])) arr[1] = null;

		return arr.filter(Boolean);
	}

	private static _parseSegments(path: string[] | string | Path): string[] {
		const rawSegments = RouterPathProvider._getArrayOfStrings(path);
		const segments = RouterPathProvider.isEditorPathname(rawSegments)
			? rawSegments
			: RouterPathProvider._getArrayOfStrings(RouterPathProvider.getPathname({ itemLogicPath: rawSegments }));

		return segments.filter(Boolean).map((p) => (p === RouterPathProvider._separator ? null : p));
	}
}

export default RouterPathProvider;
