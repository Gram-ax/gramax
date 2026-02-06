import chalk from "chalk";

type ChalkStyle = keyof typeof chalk;

export const LogStatusIcons = {
	SUCCESS_EXT: `${chalk.green("✓ ok")}`,
	SUCCESS: `${chalk.green("✓")}`,
	ERROR: `${chalk.red("X")}`,
};

const LogPrefix = {
	ERROR: LogStatusIcons.ERROR,
	SUCCESS: LogStatusIcons.SUCCESS,
};

interface LogOptions {
	styles?: ChalkStyle[];
	prefix?: keyof typeof LogPrefix;
	indent?: number;
}

const BASE_INDENT = 3;

// biome-ignore lint/complexity/noStaticOnlyClass: ok
class ChalkLogger {
	private static _silent = false;
	static #originalConsole = {
		log: console.log,
		error: console.error,
		warn: console.warn,
		info: console.info,
		debug: console.debug,
	};

	static setSilent(silent: boolean) {
		if (silent === this._silent) return;
		this._silent = silent;

		if (silent) {
			this.#originalConsole = {
				log: console.log,
				error: console.error,
				warn: console.warn,
				info: console.info,
				debug: console.debug,
			};
			console.log = () => {};
			console.error = () => {};
			console.warn = () => {};
			console.info = () => {};
			console.debug = () => {};
		} else {
			console.log = this.#originalConsole.log;
			console.error = this.#originalConsole.error;
			console.warn = this.#originalConsole.warn;
			console.info = this.#originalConsole.info;
			console.debug = this.#originalConsole.debug;
		}
	}

	static write(text?: string) {
		if (!this._checkStdout || this._silent) return;

		process.stdout.write(chalk.white(text));
	}

	static deletePrevLine() {
		if (this._silent) return;
		process.stdout.write("\r\x1b[K");
	}

	static log(str?: string, options?: LogOptions) {
		const log = this._formatLog(str, options);
		console.log(log);
	}

	static warn(str?: string, options: LogOptions = {}) {
		options.styles = options.styles || [];
		options.styles.push("yellow");
		this.log(str, options);
	}

	static error(str?: string, options: LogOptions = {}) {
		options.styles = options.styles || [];
		options.styles.push("red");
		this.log(str, options);
	}

	protected static _formatLog(str?: string, options: LogOptions = {}) {
		const { styles = ["white"], prefix, indent } = options;

		const styled = styles.reduce((acc, style) => {
			if (typeof chalk[style] === "function") return (chalk[style] as (text: string) => string)(acc);
			return acc;
		}, str ?? "");

		const indentation = " ".repeat(BASE_INDENT * indent);
		return indentation + (prefix ? `${LogPrefix[prefix]} ${styled}` : styled);
	}

	private static get _checkStdout() {
		return Boolean(process.stdout);
	}
}

export default ChalkLogger;
