/** biome-ignore-all lint/suspicious/noExplicitAny: fix */

import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import type Middleware from "@core/Api/middleware/Middleware";
import type Query from "@core/Api/Query";
import type Context from "@core/Context/Context";
import { traced } from "@ext/loggers/opentelemetry";
import type { CommandTree } from "../commands";
import type Application from "./Application";
import { ResponseKind } from "./ResponseKind";

export type CommandFlags = "otel-omit-args" | "otel-omit-result";

export interface CommandConfig<P, O> {
	path?: string;
	kind?: ResponseKind;
	middlewares?: Middleware[];
	flags?: CommandFlags[];
	do: (this: { _app: Application; _commands: CommandTree }, args: P) => O | Promise<O>;
	params?: (ctx: Context, query: Query, body?: any, signal?: AbortSignal) => P;
}

export class Command<P, O> {
	protected _app: Application = null;
	protected _commands: CommandTree = null;

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

	async do(args: P): Promise<O> {
		return await traced(
			this._c.path,
			{
				args: this._c.flags?.includes("otel-omit-args") ? [] : (args as unknown[]),
				omitResult: this._c.flags?.includes("otel-omit-result"),
			},
			async () => {
				return await this._c.do.bind(this)(args);
			},
		);
	}

	params(ctx: Context, query: Query, body: any, signal?: AbortSignal): P {
		return this._c.params?.(ctx, query, body, signal);
	}

	static create<P, O>(config: CommandConfig<P, O>): Command<P, O> {
		return new Command(config);
	}
}
