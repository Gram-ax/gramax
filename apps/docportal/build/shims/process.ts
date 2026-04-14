const noop = () => {};
const nextTick = (cb: (...args: unknown[]) => void, ...args: unknown[]) => Promise.resolve().then(() => cb(...args));

const processStub = {
	title: "browser",
	browser: true,
	env: {} as Record<string, string | undefined>,
	argv: [] as string[],
	version: "",
	versions: {} as Record<string, string>,
	platform: "browser" as NodeJS.Platform,
	arch: "unknown",
	pid: 0,

	cwd(): string {
		return "/";
	},

	chdir(): void {
		throw new Error("process.chdir is not supported in browser");
	},

	umask(): number {
		return 0;
	},

	hrtime(prev?: [number, number]): [number, number] {
		const ms = globalThis.performance?.now?.() ?? Date.now();
		const sec = Math.floor(ms / 1000);
		const nano = Math.floor((ms % 1000) * 1e6);
		const tuple: [number, number] = [sec, nano];

		if (!prev) return tuple;
		let s = tuple[0] - prev[0];
		let n = tuple[1] - prev[1];
		if (n < 0) { s -= 1; n += 1e9; }
		return [s, n];
	},

	uptime(): number {
		return (globalThis.performance?.now?.() ?? 0) / 1000;
	},

	nextTick,

	on: noop,
	addListener: noop,
	once: noop,
	off: noop,
	removeListener: noop,
	removeAllListeners: noop,
	emit: () => false,

	listeners: () => [],
	prependListener: noop,
	prependOnceListener: noop,
};

export default processStub;

export const { title, browser, env, argv, version, versions, platform, arch, pid } = processStub;
export const cwd = processStub.cwd.bind(processStub);
export const chdir = processStub.chdir.bind(processStub);
export const umask = processStub.umask.bind(processStub);
export const hrtime = processStub.hrtime.bind(processStub);
export const uptime = processStub.uptime.bind(processStub);
export { nextTick };
export const { on, addListener, once, off, removeListener, removeAllListeners, emit, listeners, prependListener, prependOnceListener } = processStub;
