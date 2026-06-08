import { getConfig } from "@app/config/AppConfig";
import type { Event, OnErrorCallback } from "@bugsnag/js";
import bugsnag from "@dynamicImports/bugsnag";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import { getRecentSpans } from "@ext/loggers/opentelemetry";
import DefaultError from "../../errorHandlers/logic/DefaultError";

const ignoredErrors = [NetworkApiError, DefaultError];

const sendBug = async (error: Error, onError?: OnErrorCallback, silentError = true): Promise<Event> => {
	const config = getConfig();
	if (!config.bugsnagApiKey || isIgnoredError(error)) return;

	const Bugsnag = (await bugsnag()).default;
	if (!Bugsnag.isStarted()) return;

	const spans = getRecentSpans();

	return new Promise((resolve, reject) =>
		Bugsnag.notify(
			error,
			(event) => {
				event.addMetadata("logs", { spans });
				const gitCommand = getGitCommand(error);
				if (gitCommand) event.groupingHash = gitCommand;
				onError?.(event, () => {});
			},
			(err, ev) => {
				if (err && !silentError) reject(err);
				return resolve(ev);
			},
		),
	);
};

const isIgnoredError = (e: Error) => {
	return ignoredErrors.some((error) => e instanceof error);
};

const getGitCommand = (error: Error): string | undefined => {
	if (error instanceof LibGit2Error) return error.command ?? extractCommandFromName(error.name);
	if (error.name?.startsWith("git (")) return extractCommandFromName(error.name);
	return undefined;
};

const extractCommandFromName = (name: string): string | undefined => {
	return name.match(/^git \(([^,)]+)/)?.[1];
};

export default sendBug;
