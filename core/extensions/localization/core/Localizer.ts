import Language, { defaultLanguage } from "./model/Language";

export class Localizer {
	constructor(private _primary: Language) {}

	extract(path: string): Language {
		if (!path) return this._primary;
		const [, maybeLanguage] = path.split("/", 2);
		return Language[maybeLanguage] ?? this._primary;
	}

	addPrefix(path: string, target: Language): string {
		const current = this._extract(path);
		if (target == this._primary) return this.trim(path);
		if (current == target) return this._sanitize(path);
		return this._sanitize(target + this.trim(path));
	}

	trim(path: string): string {
		if (!path) return "/";
		const [, maybeLanguage, ...rest] = this._sanitize(path).split("/");
		if (maybeLanguage in Language) return this._sanitize(rest.join("/"));
		return this._sanitize(maybeLanguage + (rest.length > 0 ? "/" + rest.join("/") : ""));
	}

	sanitizePrefix(path: string, prev: string): string {
		const prevLang = this._extract(prev) ?? this._primary;
		const lang = this._extract(path);
		if (lang && prevLang != lang) return lang == this._primary ? this.trim(path) : path;
		if (prevLang == this._primary) return this.trim(path);
		return this._sanitize(prevLang + this.trim(path));
	}

	getSanitizePrefixRule() {
		return (path: string, prev: string) => this.sanitizePrefix(path, prev);
	}

	private _sanitize(path: string): string {
		return path[0] == "/" ? path : "/" + path;
	}

	private _extract(path: string): Language {
		return Language[path.split("/", 2)[1]];
	}
}

const localizer = new Localizer(defaultLanguage);

export default localizer;
