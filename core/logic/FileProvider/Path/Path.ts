class Path {
	private _path: string;

	constructor(path: string | string[] = "") {
		if (!path) path = "";
		if (typeof path !== "string") path = this._parseArrayPath(path);
		this._path = path;
		this._path = this._path.replace(/\\/g, "/");
	}

	static empty = new Path();

	static join(...paths: string[]): string {
		const newPaths = paths.map((p) => new Path(p));
		const basePath = newPaths.shift();
		return basePath.join(...newPaths).value;
	}

	get value() {
		return this._path;
	}

	get parentDirectoryPath(): Path {
		const parenDirectoryPath = this._path.match(/(.+)[/\\]/)?.[1];
		if (!parenDirectoryPath) return Path.empty;
		return new Path(parenDirectoryPath);
	}

	get name(): string {
		const matches = this._path.match(/([^\\/]+)(\.[^.\\/]+)?$/);
		if (matches && matches[1]) return matches[1].split(".").slice(0, -1).join(".") || matches[1];
		return null;
	}

	get nameWithExtension(): string {
		return this._path.match(/([^\\/]+)$/)?.[1] ?? null;
	}

	get extension(): string {
		const index = this._path.lastIndexOf("/");
		return this._path.slice(index == -1 ? 0 : index).match(/\.([^.]+)$/)?.[1] ?? null;
	}

	set extension(value: string) {
		const v = value?.match(/(^[a-zA-Z]*)/);
		if (!this.extension && v) this._path = this._path + "." + v[0];
	}

	get allExtensions(): string[] {
		const cleanName = this._path.replace(/^(\.+\/|\/)/, "");

		const parts = cleanName.split(".");
		if (parts.length <= 1) {
			return [];
		}
		return parts.slice(1);
	}

	get stripExtension(): string {
		if (!this.extension) return this._path;
		return this._path.match(/(.*)\.[^.]+$/)?.[1] ?? null;
	}

	get stripDotsAndExtension(): string {
		return this._path.match(/([^.]+)(\.[^.\\/]+)?$/)?.[1] ?? null;
	}

	get rootDirectory(): Path {
		// const slashIdx = this._path.indexOf("/");
		// const dotIdx = this._path.indexOf(".");
		// if (dotIdx == -1) return new Path(this._path.split("/")[this._path[0] == "/" ? 1 : 0]);
		// let tempPath = this._path.slice(slashIdx);
		// let start = this._path.slice(0, slashIdx);
		// return new Path(start + (dotIdx < slashIdx ? "/" + tempPath.split("/")[tempPath[0] == "/" ? 1 : 0] : ""));
		const pathComponents = this._path.split("/");
		const firstComponent = pathComponents[0];

		if (firstComponent === ".") {
			return new Path(`${firstComponent}/${pathComponents[1]}`);
		} else if (firstComponent === ".." || firstComponent === "...") {
			return new Path(`${firstComponent}/${pathComponents[1]}`);
		} else if (this._path.startsWith("/")) {
			return new Path(`/${pathComponents[1]}`);
		} else {
			return new Path(firstComponent);
		}
	}

	get removeExtraSymbols(): Path {
		return new Path(this._path.match(/^(\.?\/)?(.*)/)?.[2] ?? null);
	}

	toString() {
		return this._path;
	}

	compare(path: Path) {
		return path.removeExtraSymbols.value == this.removeExtraSymbols.value;
	}

	startsWith(path: Path) {
		return this.removeExtraSymbols.value.startsWith(path.removeExtraSymbols.value);
	}

	endsWith(path: Path) {
		return this.removeExtraSymbols.value.endsWith(path.removeExtraSymbols.value);
	}

	includes(path: Path) {
		return this._path.includes(path._path);
	}

	subDirectory(path: Path): Path {
		const thisPath = this.removeExtraSymbols.value;
		const otherPath = path.removeExtraSymbols.value;
		if (otherPath.slice(0, thisPath.length) != thisPath) return null;
		return new Path(otherPath.slice(thisPath.length)).removeExtraSymbols;
	}

	getRelativePath(path: Path): Path {
		const thisPath = this.removeExtraSymbols;
		path = path.removeExtraSymbols;
		let generalPath = thisPath.parentDirectoryPath;
		let depthCount = thisPath.extension ? 0 : 1;
		while (!path.startsWith(generalPath)) {
			generalPath = generalPath.parentDirectoryPath;
			depthCount++;
		}
		if (generalPath._path == path._path) depthCount++;
		return new Path([
			"." + "/..".repeat(depthCount),
			(generalPath._path == path._path ? "/" + path.name : generalPath._path == "" ? "/" : "",
			generalPath.subDirectory(path).value),
		]);
	}

	join(...paths: Path[]): Path {
		paths = paths.filter((p) => p);
		let joinPath: Path = new Path(this.toString());
		paths.forEach((p) => {
			if (!p._path) return;
			joinPath = joinPath._join(p);
		});
		return joinPath;
	}

	concat(...path: Path[]): Path {
		const paths = path.filter((p) => p).map((p) => p.value);
		return new Path(this._path.concat(...paths));
	}

	getNewName(newFileName: string) {
		return new Path(
			this.parentDirectoryPath.value + `/${newFileName}${this.extension ? `.${this.extension}` : ""}`,
		);
	}

	private _parseArrayPath(path: string[]) {
		return path.filter((p) => p).join("/") ?? "";
	}

	private _join(path: Path): Path {
		const isRootJoin =
			path._path.slice(0, 5) == "./..." || path._path.slice(0, 4) == "/..." || path._path.slice(0, 3) == "...";
		const newPath = isRootJoin
			? this._integratedJoin(this.rootDirectory.toString(), path._path.slice(path._path.indexOf("/")))
			: this._integratedJoin(this._path, path._path);

		return new Path(newPath);
	}

	private _integratedJoin(...paths: string[]) {
		let joined: string;
		if (paths.length === 0) return ".";

		for (let i = 0; i < paths.length; ++i) {
			const arg = paths[i];
			if (arg.length > 0) {
				if (joined === undefined) joined = arg;
				else joined += "/" + arg;
			}
		}
		if (joined === undefined) return ".";

		return this._normalize(joined);
	}

	private _normalize(path: string) {
		if (path.length === 0) return ".";

		const isAbsolute = path.charCodeAt(0) === 47;
		const trailingSeparator = path.charCodeAt(path.length - 1) === 47;

		path = this._normalizeStringPosix(path, !isAbsolute);

		if (path.length === 0 && !isAbsolute) path = ".";
		if (path.length > 0 && trailingSeparator) path += "/";

		if (isAbsolute) return "/" + path;
		return path;
	}

	private _normalizeStringPosix(path, allowAboveRoot) {
		let res = "";
		let lastSegmentLength = 0;
		let lastSlash = -1;
		let dots = 0;
		let code;
		for (let i = 0; i <= path.length; ++i) {
			if (i < path.length) code = path.charCodeAt(i);
			else if (code === 47) break;
			else code = 47;
			if (code === 47) {
				if (!(lastSlash === i - 1 || dots === 1)) {
					if (lastSlash !== i - 1 && dots === 2) {
						if (
							res.length < 2 ||
							lastSegmentLength !== 2 ||
							res.charCodeAt(res.length - 1) !== 46 ||
							res.charCodeAt(res.length - 2) !== 46
						) {
							if (res.length > 2) {
								const lastSlashIndex = res.lastIndexOf("/");
								if (lastSlashIndex !== res.length - 1) {
									if (lastSlashIndex === -1) {
										res = "";
										lastSegmentLength = 0;
									} else {
										res = res.slice(0, lastSlashIndex);
										lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
									}
									lastSlash = i;
									dots = 0;
									continue;
								}
							} else if (res.length === 2 || res.length === 1) {
								res = "";
								lastSegmentLength = 0;
								lastSlash = i;
								dots = 0;
								continue;
							}
						}
						if (allowAboveRoot) {
							if (res.length > 0) res += "/..";
							else res = "..";
							lastSegmentLength = 2;
						}
					} else {
						if (res.length > 0) res += "/" + path.slice(lastSlash + 1, i);
						else res = path.slice(lastSlash + 1, i);
						lastSegmentLength = i - lastSlash - 1;
					}
				}
				lastSlash = i;
				dots = 0;
			} else if (code === 46 && dots !== -1) {
				++dots;
			} else {
				dots = -1;
			}
		}
		return res;
	}
}

export default Path;
