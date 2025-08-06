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

class ChalkLogger {
	static write(text?: string) {
		if (!this._checkStdout) return;

		process.stdout.write(chalk.white(text));
	}

	static deletePrevLine() {
		process.stdout.write("\r\x1b[K");
	}

	static log(str?: string, options?: LogOptions) {
		const log = this._formatLog(str, options);
		console.log(log);
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
