import type { AppConfig } from "@app/config/AppConfig";
import type { RouterRule } from "@core/Api/Router";
import PathUtils from "path";
import WebRouter from "../../../../web/src/logic/Api/WebRouter";

export default class StaticRouter {
	private static additionalRules: RouterRule[] = [
		(path: string) => {
			const basePath = (global.config as AppConfig).paths.base.value;
			return PathUtils.join(basePath, path);
		},
	];

	static use(rules: RouterRule[]) {
		return WebRouter.use([...rules, ...this.additionalRules]);
	}
}
