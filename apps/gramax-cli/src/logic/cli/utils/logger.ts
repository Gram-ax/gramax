import chalk from "chalk";
import ChalkLogger, { LogStatusIcons } from "../../../utils/ChalkLogger";

export type CustomSuccessLog<T> = (result: T) => { message: string; LogSymbol?: keyof typeof LogStatusIcons };

export const STEP_ERROR_NAME = "StepError";

const logResult = (message: string, LogSymbol: keyof typeof LogStatusIcons) => {
	const logResult = `\r${
		LogSymbol ? `${chalk.white(`${message.padEnd(40)}`)}${LogStatusIcons[LogSymbol]}` : chalk.white(message)
	}\n`;
	ChalkLogger.write(logResult);
};

export const logStep = async <T>(
	step: string,
	action: () => Promise<T> | T,
	params?: {
		catchF?: (error: Error) => Error;
		finallyF?: () => void;
		customSuccessLog?: CustomSuccessLog<T>;
	},
) => {
	ChalkLogger.write(`${step}...`);

	try {
		const result = await action();
		const successLog = params?.customSuccessLog?.(result) ?? { message: step, LogSymbol: "SUCCESS_EXT" };
		logResult(successLog.message, successLog.LogSymbol);
		return result;
	} catch (e) {
		logResult(step, "ERROR");
		const error = params?.catchF ? params.catchF(e as Error) : e;
		(error as Error).name = STEP_ERROR_NAME;
		throw error;
	} finally {
		params?.finallyF?.();
	}
};

export const logStepWithErrorSuppression = async <T>(
	logMessage: string,
	action: () => Promise<T> | T,
	successLog?: CustomSuccessLog<T>,
) => {
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;
	console.error = () => {};
	console.warn = () => {};
	return await logStep(logMessage, action, {
		finallyF: () => {
			console.warn = originalConsoleWarn;
			console.error = originalConsoleError;
		},
		customSuccessLog: successLog,
	});
};
