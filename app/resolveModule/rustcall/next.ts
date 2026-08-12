/** biome-ignore-all lint/suspicious/noExplicitAny: args/error shapes vary across fs and git backends */
import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";
import { healthcheckEvents } from "@ext/git/core/GitCommands/errors/HealthcheckEvents";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import { type CredsArgs, progress } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { span } from "@ext/loggers/opentelemetry";
import native from "../../../apps/next/crates/next-gramax-core";
import { fsArgOrder } from "./fsArgOrder";
import { parseCommand } from "./index";

const tryParse = (data: any) => {
	try {
		return JSON.parse(data);
	} catch {
		return data;
	}
};

const intoTreeReadScope = (data: any) => {
	if (!data || data === "HEAD") return { objectType: "Head", reference: null };
	if (data.commit) return { objectType: "Commit", reference: data.commit };
	if (data.reference) return { objectType: "Reference", reference: data.reference };
};

const callFs = async <O>(cmd: string, args: Record<string, unknown>): Promise<O> => {
	const order = fsArgOrder[cmd];
	if (!order) throw new Error(`unknown fs command: ${cmd}`);

	const fn = (native as any)[cmd];
	if (typeof fn !== "function") throw new Error(`native fs binding missing: ${cmd}`);

	const ctx = span()?.spanContext();
	const spanId = ctx?.spanId;
	const traceId = ctx?.traceId;

	const positional = order.map((key) => {
		const v = args[key];
		if (key === "scope") {
			const s = v as { kind?: string; scope?: unknown };
			if (s && s.kind === "git" && s.scope === "HEAD") {
				return JSON.stringify({ ...s, scope: null });
			}
			return JSON.stringify(v);
		}
		if (key === "compress") return v ? JSON.stringify(v) : null;
		if (key === "opts") return JSON.stringify(v ?? {});
		if (key === "content") {
			if (Buffer.isBuffer(v)) return v;
			if (typeof v === "string") return Buffer.from(v);
			if (v instanceof Uint8Array) return Buffer.from(v);
			return Buffer.from((v ?? "") as string);
		}
		return v;
	});

	try {
		const isReadFile = cmd === "read_file";
		const result = await fn(...positional, spanId, traceId);
		if (isReadFile) return result as O;
		if (typeof result === "string") return JSON.parse(result) as O;
		return result as O;
	} catch (err: unknown) {
		const error =
			typeof err === "string" ? tryParse(err) : (err as Error)?.stack ? tryParse((err as Error).message) : err;
		if (error?.name === "Git") {
			const subset = typeof error.subset === "number" ? error.subset : 0;
			const klass = typeof error.class === "number" ? error.class : 0;
			const code = typeof error.code === "number" ? error.code : 0;
			const message = error.message ?? "";
			throw new LibGit2Error(`git (${cmd}, ${subset}, ${klass}, ${code})`, message, subset, klass, code, cmd);
		}
		throw new IoError({
			name: `IO (${cmd})`,
			code: error?.name,
			message: `${error?.name ?? "Error"}: ${error?.message ?? error};\nargs: ${JSON.stringify(args, null, 4)}`,
		});
	}
};

const callGit = async <O>(cmd: string, args: any = {}): Promise<O> => {
	let stringifiedArgs: string | null = null;

	if (cmd === "clone")
		args.callback = (_: unknown, val: string) => progress[args.opts.cancelToken]?.(JSON.parse(val));
	if (cmd === "diff") stringifiedArgs = JSON.stringify(args);

	if (typeof args.scope !== "undefined") args.scope = intoTreeReadScope(args.scope);

	const ctx = span()?.spanContext();
	const spanId = ctx?.spanId;
	const traceId = ctx?.traceId;

	const fn = (native as any)[cmd];
	if (typeof fn !== "function") throw new Error(`native git binding missing: ${cmd}`);

	try {
		const promise = stringifiedArgs
			? fn(stringifiedArgs, spanId, traceId)
			: fn(...Object.values(args), spanId, traceId);
		const result = await promise;
		if (result?.stack) throw result;
		return typeof result === "string" ? JSON.parse(result) : result;
	} catch (err: any) {
		let error = typeof err === "string" ? tryParse(err) : err;
		error = err?.stack ? tryParse(err.message) : error;
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";

		const libGit2Error = new LibGit2Error(
			`git (${cmd}, ${error.subset ?? "<unknown subset>"}, ${error.class ?? "<unknown class>"}, ${
				error.code ?? "<unknown code>"
			})`,
			`${error?.message?.trim() || error}\nArgs: ${JSON.stringify(args, null, 4)}`,
			error.subset,
			error.class,
			error.code,
			cmd,
		);

		if (libGit2Error.code === GitErrorCode.HealthcheckFailed && args?.repoPath) {
			await healthcheckEvents.emit("healthcheck-failed", { repoPath: args.repoPath, error: libGit2Error });
		}

		throw libGit2Error;
	}
};

export const call = async <O>(command: string, args: any = {}): Promise<O> => {
	const [namespace, cmd] = parseCommand(command);
	return namespace === "git" ? callGit<O>(cmd, args) : callFs<O>(cmd, args);
};
