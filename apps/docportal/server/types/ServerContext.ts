import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type DocportalApiRequest from "../logic/DocportalApiRequest";
import type DocportalApiResponse from "../logic/DocportalApiResponse";

interface ServerContext {
	path: URL;
	req: DocportalApiRequest;
	res: DocportalApiResponse;
	app: Application;
	commands: CommandTree;
}

export default ServerContext;
