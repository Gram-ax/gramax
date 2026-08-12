/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import type { RouterRule } from "@core/Api/Router";
import WebRouter from "../../../web/src/logic/Api/WebRouter";
import { getBasePath } from "./basePath";

export default class DocportalRouter {
	static use(rules: RouterRule[]) {
		const router = WebRouter.use(rules);
		return new Proxy(router, {
			get(target, prop, receiver) {
				if (prop === "basePath") return getBasePath();
				return Reflect.get(target, prop, receiver);
			},
		});
	}
}
