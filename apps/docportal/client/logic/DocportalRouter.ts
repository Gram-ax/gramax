/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import type { RouterRule } from "@core/Api/Router";
import BrowserRouter from "apps/browser/src/logic/Api/BrowserRouter";

export default class DocportalRouter {
	static use(rules: RouterRule[]) {
		const router = BrowserRouter.use(rules);
		return new Proxy(router, {
			get(target, prop, receiver) {
				if (prop === "basePath") return "";
				return Reflect.get(target, prop, receiver);
			},
		});
	}
}
