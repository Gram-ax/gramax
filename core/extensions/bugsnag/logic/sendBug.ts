import Bugsnag, { Event, OnErrorCallback } from "@bugsnag/js";
import DefaultError from "../../errorHandlers/logic/DefaultError";

const sendBug = (error: Error, onError?: OnErrorCallback): Promise<Event> => {
	if (!Bugsnag.isStarted() || _isDefaultError(error)) return;
	return new Promise((resolve) =>
		Bugsnag.notify(error, onError, (err, ev) => {
			return err ? resolve(undefined) : resolve(ev);
		}),
	);
};

const _isDefaultError = (e: Error) => {
	return e instanceof DefaultError;
};

export default sendBug;
