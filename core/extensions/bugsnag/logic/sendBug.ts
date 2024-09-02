import Bugsnag, { Event, OnErrorCallback } from "@bugsnag/js";
import DefaultError from "../../errorHandlers/logic/DefaultError";

const sendBug = (error: Error, onError?: OnErrorCallback, silentError = true): Promise<Event> => {
	if (!Bugsnag.isStarted() || _isDefaultError(error)) return;
	return new Promise((resolve, reject) =>
		Bugsnag.notify(error, onError, (err, ev) => {
			if (err && !silentError) reject(err);
			return resolve(ev);
		}),
	);
};

const _isDefaultError = (e: Error) => {
	return e instanceof DefaultError;
};

export default sendBug;
