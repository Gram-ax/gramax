export const normalizePosix = (path: string) => {
	if (path.length === 0) return ".";

	const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
	const trailingSeparator = path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;

	path = normalizeString(path, !isAbsolute, true);

	if (path.length === 0) {
		if (isAbsolute) return "/";
		return trailingSeparator ? "./" : ".";
	}
	if (trailingSeparator) path += "/";

	return isAbsolute ? `/${path}` : path;
};

export const normalizeWin = (path: string) => {
	const len = path.length;
	if (len === 0) return ".";
	let rootEnd = 0;
	let device: string;
	let isAbsolute = false;
	const code = path.charCodeAt(0);

	if (len === 1) return isPosixPathSeparator(code) ? "\\" : path;
	if (isPathSeparator(code)) {
		isAbsolute = true;

		if (isPathSeparator(path.charCodeAt(1))) {
			let j = 2;
			let last = j;
			while (j < len && !isPathSeparator(path.charCodeAt(j))) {
				j++;
			}
			if (j < len && j !== last) {
				const firstPart = path.slice(last, j);
				last = j;
				while (j < len && isPathSeparator(path.charCodeAt(j))) {
					j++;
				}
				if (j < len && j !== last) {
					last = j;
					while (j < len && !isPathSeparator(path.charCodeAt(j))) {
						j++;
					}
					if (j === len) {
						return `\\\\${firstPart}\\${path.slice(last)}\\`;
					}
					if (j !== last) {
						device = `\\\\${firstPart}\\${path.slice(last, j)}`;
						rootEnd = j;
					}
				}
			}
		} else {
			rootEnd = 1;
		}
	} else if (isWindowsDeviceRoot(code) && path.charCodeAt(1) === CHAR_COLON) {
		device = path.slice(0, 2);
		rootEnd = 2;
		if (len > 2 && isPathSeparator(path.charCodeAt(2))) {
			isAbsolute = true;
			rootEnd = 3;
		}
	}

	let tail = rootEnd < len ? normalizeString(path.slice(rootEnd), !isAbsolute, false) : "";
	if (tail.length === 0 && !isAbsolute) tail = ".";
	if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) tail += "\\";
	if (device === undefined) {
		return isAbsolute ? `\\${tail}` : tail;
	}
	return isAbsolute ? `${device}\\${tail}` : `${device}${tail}`;
};

const CHAR_DOT = 46;
const CHAR_FORWARD_SLASH = 47;
const CHAR_BACKWARD_SLASH = 92;
const CHAR_LOWERCASE_Z = 122;
const CHAR_UPPERCASE_A = 65;
const CHAR_LOWERCASE_A = 97;
const CHAR_UPPERCASE_Z = 90;
const CHAR_COLON = 58;

const isPathSeparator = (code: number) => {
	return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const isPosixPathSeparator = (code: number) => {
	return code === CHAR_FORWARD_SLASH;
};

const isWindowsDeviceRoot = (code: number) => {
	return (
		(code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) || (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z)
	);
};

const normalizeString = (path: string, allowAboveRoot: boolean, isPosix: boolean) => {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code = 0;

	const separator = isPosix ? "/" : "\\";
	const isPathS = isPosix ? isPosixPathSeparator : isPathSeparator;

	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) code = path.charCodeAt(i);
		else if (isPathS(code)) break;
		else code = CHAR_FORWARD_SLASH;

		if (isPathS(code)) {
			if (lastSlash === i - 1 || dots === 1) {
			} else if (dots === 2) {
				if (
					res.length < 2 ||
					lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== CHAR_DOT ||
					res.charCodeAt(res.length - 2) !== CHAR_DOT
				) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf(separator);
						if (lastSlashIndex === -1) {
							res = "";
							lastSegmentLength = 0;
						} else {
							res = res.slice(0, lastSlashIndex);
							lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
						}
						lastSlash = i;
						dots = 0;
						continue;
					} else if (res.length !== 0) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					res += res.length > 0 ? `${separator}..` : "..";
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += `${separator}${path.slice(lastSlash + 1, i)}`;
				else res = path.slice(lastSlash + 1, i);
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === CHAR_DOT && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
};
