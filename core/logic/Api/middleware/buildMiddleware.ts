import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Middleware from "@core/Api/middleware/Middleware";

const buildMiddleware = (app: Application, commands: CommandTree, middlewares: Middleware[], process: Middleware) => {
	return [...middlewares, process].map((m) => m.init({ app, commands })).reduceRight((r, l) => l.SetNext(r));
};

export default buildMiddleware;
