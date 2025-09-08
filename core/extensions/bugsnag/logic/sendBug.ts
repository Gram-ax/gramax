import Bugsnag, { Event, OnErrorCallback } from "@bugsnag/js";
import DefaultError from "../../errorHandlers/logic/DefaultError";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
const ignoredErrors = [NetworkApiError, DefaultError];

const sendBug = (error: Error, onError?: OnErrorCallback, silentError = true): Promise<Event> => {
	if (!Bugsnag.isStarted() || _isIgnoredError(error)) return;
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
