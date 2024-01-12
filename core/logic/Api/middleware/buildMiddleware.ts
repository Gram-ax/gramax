import { CommandTree } from "@app/commands";
import Application from "@app/types/Application";
import Middleware from "@core/Api/middleware/Middleware";

const buildMiddleware = (app: Application, commands: CommandTree, middlewares: Middleware[], process: Middleware) => {
	return [...middlewares, process].map((m) => m.init({ app, commands })).reduceRight((r, l) => l.SetNext(r));
};

export default buildMiddleware;
