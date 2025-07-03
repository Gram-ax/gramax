import PathUtils from "path";
import { AppConfig } from "@app/config/AppConfig";
import BrowserRouter from "../../../../browser/src/logic/Api/BrowserRouter";
import { RouterRule } from "@core/Api/Router";

export default class StaticRouter {
	private static additionalRules: RouterRule[] = [
		(path: string) => {
			const basePath = (global.config as AppConfig).paths.base.value;
			return PathUtils.join(basePath, path);
		},
	];

	static use(rules: RouterRule[]) {
		return BrowserRouter.use([...rules, ...this.additionalRules]);
	}
}
