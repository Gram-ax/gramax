import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import Middleware from "@core/Api/middleware/Middleware";
import Query from "@core/Api/Query";
import Context from "@core/Context/Context";
import { CommandTree } from "../commands";
import Application from "./Application";
import { ResponseKind } from "./ResponseKind";

export interface CommandConfig<P, O> {
	path?: string;
	kind?: ResponseKind;
	middlewares?: Middleware[];
	do: (this: { _app: Application; _commands: CommandTree }, args: P) => O | Promise<O>;
	params?: (ctx: Context, query: Query, body?: any, signal?: AbortSignal) => P;
}

export class Command<P, O> {
	private _app: Application = {} as any;
	private _commands: CommandTree = {} as any;

	constructor(private _c: CommandConfig<P, O>) {
		if (!_c.kind) _c.kind = ResponseKind.none;
		_c.middlewares = [new MainMiddleware(_c.path), ...(_c.middlewares ?? [])];
	}

	get path(): string {
		return this._c.path;
	}

	get middlewares(): Middleware[] {
		return this._c.middlewares;
	}

	get kind(): ResponseKind {
		return this._c.kind;
	}

	do(args: P): O | Promise<O> {
		return this._c.do.bind(this)(args);
	}

	params(ctx: Context, query: Query, body: any, signal?: AbortSignal): P {
		return this._c.params?.(ctx, query, body, signal);
	}

	static create<P, O>(config: CommandConfig<P, O>): Command<P, O> {
		return new Command(config);
	}
}
