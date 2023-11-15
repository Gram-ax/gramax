import PathUtils from "path";
import { BaseLink } from "../../../extensions/navigation/NavigationLinks";
import { Router } from "../../../logic/Api/Router";

class Url implements BaseLink {
	pathname: string;
	query?: { [name: string]: string };
	hash?: string;

	private constructor(link: BaseLink) {
		this.pathname = link?.pathname ?? "";
		this.query = link?.query ?? {};
		this.hash = link?.hash ?? "";
	}

	static from(link: BaseLink) {
		return new Url(link);
	}

	static fromBasePath(path: string, basePath: string, query: { [name: string]: string } = {}): Url {
		const pathname = PathUtils.join(basePath ?? "/", path ?? "/")
			.replace(":/", "://")
			.replace(/\\/g, "/");
		return Url.from({ pathname, query });
	}

	static fromRouter(router: Router, link?: BaseLink) {
		return Url.from({
			pathname: link?.pathname ?? router.path,
			query: link?.query,
			hash: link?.hash ?? router.path.split("#")[1],
		});
	}

	toString(): string {
		return (
			this.pathname +
			(Object.keys(this.query).length ? "?" : "") +
			Object.keys(this.query)
				.map((name) => (this.query[name] ? name + `=${encodeURIComponent(this.query[name])}` : ""))
				.filter((e) => e != "")
				.join("&")
		);
	}
}

export default Url;
