export type PathList = {
	readonly currentPath: string;
	readonly restOfPath: string;
	readonly last: string;
	readonly path: string[];
	readonly fullPath: string[];
	next: () => string | undefined;
	isEmpty: () => boolean;
	hasNext: () => boolean;
};

export default function getPathList(fullPath: string): PathList {
	const pathSeparator = " > ";
	const pathList = fullPath.split(pathSeparator).reverse();
	const restOfPath = [...pathList];
	return {
		get currentPath() {
			return fullPath.substring(0, fullPath.indexOf(this.restOfPath));
		},
		get restOfPath() {
			return restOfPath.reverse().join(pathSeparator);
		},
		get last() {
			return pathList[0];
		},
		get path() {
			return [...fullPath.split(pathSeparator)];
		},
		get fullPath() {
			return [...pathList].reverse();
		},
		next: () => restOfPath.pop(),
		isEmpty: () => restOfPath.length <= 0,
		hasNext: () => restOfPath.length > 0,
	};
}
