import { createWriteStream, mkdirSync, WriteStream } from "fs-extra";
import { dirname } from "path";
import stripAnsi from "strip-ansi";
import ChalkLogger from "../../../utils/ChalkLogger";

export class ChalkFileLogger extends ChalkLogger {
	private _outputFileContent: WriteStream;
	private _writeQueue: Promise<void> = Promise.resolve();

	constructor(private _outputFilePath: string) {
		super();
		mkdirSync(dirname(this._outputFilePath), { recursive: true });
		this._outputFileContent = createWriteStream(this._outputFilePath, { flags: "w" });

		this._outputFileContent.on("error", (err) => {
			ChalkLogger.log(`File stream error for log file: ${err.message}`, { prefix: "ERROR" });
		});
	}

	log(...props: Parameters<typeof ChalkLogger.log>) {
		ChalkLogger.log(...props);
		this._logFile(stripAnsi(ChalkLogger._formatLog(...props)));
	}

	private _logFile(log: string) {
		this._writeQueue = this._writeQueue.then(() => {
			return new Promise<void>((resolve) => {
				try {
					const canContinue = this._outputFileContent.write(log + "\n");
					if (canContinue) {
						resolve();
					} else {
						this._outputFileContent.once("drain", resolve);
					}
				} catch (error) {
					ChalkLogger.log(`Error writing to log file: ${error.message}`, { prefix: "ERROR" });
					resolve();
				}
			});
		});
	}

	async close() {
		await this._writeQueue;

		return new Promise<void>((resolve) => {
			this._outputFileContent.end(() => {
				resolve();
			});
		});
	}
}
