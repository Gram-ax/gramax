import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import Query from "@core/Api/Query";
import { Router, RouterRule } from "@core/Api/Router";
import { NextRouter as DefaultNextRouter, useRouter as useDefaultNextRouter } from "next/router";
import { useEffect } from "react";

export default class NextRouter extends Router {
	private _hash?: string;

	private constructor(private _router: DefaultNextRouter, rules: RouterRule[]) {
		super(rules);
	}

	get basePath() {
		return this._router?.basePath;
	}

	get query() {
		return this._router?.query as Query;
	}

	get path() {
		return this._router?.asPath;
	}

	get hash(): string {
		if (typeof window === "undefined") return encodeURI(this._hash);

		return encodeURI(window.location.hash ?? "");
	}

	pushQuery(query: Query) {
		this._router.query = query;
		void this._router.push({ query: this._router.query });
		return this;
	}

	pushPath(path: string) {
		const transformed = this._transform(path);
		void this._router.push({ pathname: transformed }).then(refreshPage).catch(null);
		return this;
	}

	static use(rules: RouterRule[]) {
		let router = null;

		try {
			router = new NextRouter(useDefaultNextRouter(), rules);
		} catch (e) {
			console.log(e);
		}

		useEffect(() => {
			if (router && typeof window !== "undefined") router._hash = window.location.hash;
		}, [...rules, router?.path, router?.query]);

		return router;
	}
}
