import PathUtils from "path";
import { BaseLink } from "../../../extensions/navigation/NavigationLinks";
import { Router } from "../../../logic/Api/Router";

class Url implements BaseLink {
	pathname: string;
	query?: { [name: string]: string };
	hash?: string;
	basePath?: string;

	private constructor(link: BaseLink & { basePath?: string }) {
		this.pathname = link?.pathname ?? "";
		this.query = link?.query ?? {};
		this.hash = link?.hash ?? "";
		this.basePath = link?.basePath ?? undefined;
	}

	static from(link: BaseLink & { basePath?: string }) {
		return new Url(link);
	}

	static fromBasePath(path: string, basePath: string, query: { [name: string]: string } = {}): Url {
		const pathname = PathUtils.join(basePath ?? "/", path ?? "/")
			.replace(":/", "://")
			.replace(/\\/g, "/");
		return Url.from({ pathname, query, basePath });
	}

	static fromRouter(router: Router, link?: BaseLink) {
		return Url.from({
			pathname: link?.pathname ?? router.path,
			query: link?.query,
			hash: link?.hash ?? router.path.split("#")[1],
			basePath: router.basePath,
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
