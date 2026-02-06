import { getConfig } from "@app/config/AppConfig";
import type { Event, OnErrorCallback } from "@bugsnag/js";
import bugsnag from "@dynamicImports/bugsnag";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import DefaultError from "../../errorHandlers/logic/DefaultError";

const ignoredErrors = [NetworkApiError, DefaultError];

const sendBug = async (error: Error, onError?: OnErrorCallback, silentError = true): Promise<Event> => {
	const config = getConfig();
	if (!config.bugsnagApiKey || _isIgnoredError(error)) return;

	const Bugsnag = (await bugsnag()).default;
	if (!Bugsnag.isStarted()) return;

	return new Promise((resolve, reject) =>
		Bugsnag.notify(error, onError, (err, ev) => {
			if (err && !silentError) reject(err);
			return resolve(ev);
		}),
	);
};

const _isIgnoredError = (e: Error) => {
	return ignoredErrors.some((error) => e instanceof error);
};

export default sendBug;
