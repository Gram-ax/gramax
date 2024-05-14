import Path from "@core/FileProvider/Path/Path";
import PathnameData from "@core/RouterPath/model/PathnameData";

export default class RouterPathProvider {
	private static readonly _separator = "-";

	static parsePath(path: string[] | Path): PathnameData {
		const currentPath = this._getArrayOfStrings(path);
		const [sourceName, group, repName, branch, dir, ...filePath] = currentPath.map((p) =>
			p === this._separator ? undefined : p,
		);
		const normalizedFilePath = filePath?.map((x) => decodeURIComponent(x));
		const catalogName = dir ?? repName;
		const itemLogicPath = [catalogName, ...normalizedFilePath];
		return {
			sourceName,
			group,
			repName,
			branch: branch ? decodeURIComponent(branch) : undefined,
			catalogName,
			filePath: normalizedFilePath,
			itemLogicPath,
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
		catalogName = catalogName === data.repName ? this._separator : catalogName;

		return new Path([
			data.sourceName ?? this._separator,
			data.group ?? this._separator,
			data.repName ?? this._separator,
			data.branch ? encodeURIComponent(data.branch) : this._separator,
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

	static isNewPath(path: string[] | Path): boolean {
		const currentPath = this._getArrayOfStrings(path);
		return currentPath[0].includes(".") || currentPath[0] == this._separator;
	}

	static updatePathnameData(basePathname: PathnameData | string[] | Path, newPathnameData: PathnameData): Path {
		const pathnameData =
			basePathname instanceof Array || basePathname instanceof Path ? this.parsePath(basePathname) : basePathname;
		return this.getPathname({ ...pathnameData, ...newPathnameData });
	}

	static validate(pathdata: PathnameData): boolean {
		return !!(pathdata.sourceName && pathdata.group && pathdata.repName);
	}

	static isLocal(pathdata: PathnameData): boolean {
		return !pathdata.sourceName && !pathdata.group && !pathdata.repName;
	}

	private static _getArrayOfStrings(path: string[] | Path): string[] {
		return path instanceof Array ? path : path.value.split("/");
	}
}
