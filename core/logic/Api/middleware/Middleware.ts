import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";

export default abstract class Middleware {
	protected _app: Application = {} as any;
	protected _commands: CommandTree = {} as any;
	protected _next: Middleware = null;

	SetNext(next: Middleware): Middleware {
		this._next = next;
		return this;
	}

	init({ app, commands }: { app: Application; commands: CommandTree }) {
		this._app = app;
		this._commands = commands;
		return this;
	}

	abstract Process(req: ApiRequest, res: ApiResponse): Promise<void>;
}
