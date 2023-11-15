import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import Query from "@core/Api/Query";
import { Router, RouterRule } from "@core/Api/Router";
import { NextRouter as DefaultNextRouter, useRouter as useDefaultNextRouter } from "next/router";

export default class NextRouter extends Router {
	private constructor(
		private _router: DefaultNextRouter,
		rules: RouterRule[],
	) {
		super(rules);
	}

	get basePath() {
		return this._router?.basePath;
	}

	get query() {
		return this._router?.query as Query;
	}

	get path() {
		return this._router.asPath;
	}

	pushQuery(query: Query) {
		this._router.query = query;
		void this._router.push(this._router.route);
		return this;
	}

	pushPath(path: string) {
		const transformed = this._transform(path);
		this._router.push({ pathname: transformed }).then(refreshPage).catch(null);
		return this;
	}

	static use(rules: RouterRule[]) {
		return new NextRouter(useDefaultNextRouter(), rules);
	}
}
