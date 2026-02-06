import resolveModule from "@app/resolveModule/frontend";
import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type FetchResponse from "@core-ui/ApiServices/Types/FetchResponse";
import Method from "@core-ui/ApiServices/Types/Method";
import type MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type Url from "@core-ui/ApiServices/Types/Url";
import trimRoutePrefix from "@core-ui/ApiServices/trimRoutePrefix";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import type { Equal } from "@core-ui/utils/utilTypes";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";

export type ResponseParser = "json" | "text" | "blob" | (<T>(res: FetchResponse<unknown>) => Promise<T>);

export type ResponseMap<T, O> = (data: T) => Promise<O> | O;

export type RequestParser = "json" | "text" | "blob" | ((body: unknown) => Promise<BodyInit> | BodyInit);

export type OnDidCommandEv = { command: string; args: object; result: unknown };

export type UseApiEvents = Event<"on-did-command", OnDidCommandEv>;

export enum RequestStatus {
	Init,
	Loading,
	Ready,
	Error,
}

export type CallApiDefer<T, O> = (deferApiProps?: Partial<UseApiProps<T, O>>) => Promise<O> | O;
export type CallApi<T> = () => Promise<T> | T;
export type CreateUrl = (api: ApiUrlCreator) => Url | Promise<Url>;
export type ResetApi = () => void;
export type OnStart = () => Promise<void> | void;
export type OnDone<T> = (data: T) => Promise<void> | void;
export type onFinally<T> = (data: T, error: Error) => Promise<void> | void;
export type OnError = (error: Error) => Promise<void> | void;

export type SpecifyOrCreateApi = Url | CreateUrl;

/**
 * API call props
 *
 * @param {SpecifyOrCreateApi} url - Endpoint URL or callback to create URL using ApiUrlCreator
 * @param {UseApiOptions} [opts] - Request options
 * @param {ResponseParser} [parse] - Response parsing mode. Supports pre-defined modes (`json`, `text`, `blob`) or a custom callback
 * @param {boolean} [auto] - If `true`, the request will be made automatically when the component mounts
 * @param {OnStart} [onStart] - Callback executed before request starts
 * @param {OnDone<O>} [onDone] - Callback executed on successful response with mapped ready-to-use data
 * @param {onFinally<O>} [onFinally] - Callback executed after request completion (success or error)
 * @param {OnError} [onError] - Callback executed on request error
 * @param {ResponseMap<T, O>} [map] - Optional. Maps parsed response data before setting the data state
 */
export type UseApiProps<T = unknown, O = T> = {
	url: SpecifyOrCreateApi;
	opts?: UseApiOptions;
	parse?: ResponseParser;
	auto?: boolean;
	onStart?: OnStart;
	onDone?: OnDone<O>;
	onFinally?: onFinally<O>;
	onError?: OnError;
} & Equal<O, T, { map?: ResponseMap<T, O> }, { map: ResponseMap<T, O> }>;

export type UseApiResult<O> = {
	data: O | null;
	error: Error | null;
	status: RequestStatus;
	call: CallApi<O>;
	reset: ResetApi;
};

/**
 * Request options
 *
 * @param {BodyInit} [body] - Request body
 * @param {ResponseParser} [parse] - Response parsing mode. Supports pre-defined modes (`json`, `text`, `blob`) or a custom callback
 * @param {MimeTypes} [mime] - Request mime type
 * @param {Method} [method] - Request method
 * @param {boolean} [consumeError] - If `true`, the error state will be set but no dialog will be shown
 *
 */
export type UseApiOptions = {
	body?: unknown;
	parse?: RequestParser;
	mime?: MimeTypes;
	method?: Method;
	consumeError?: boolean;
	failOnParse?: boolean;
	abort?: AbortSignal;
};

const parseResponse = async <T>(res: FetchResponse<T>, mode: ResponseParser, throwError: boolean): Promise<T> => {
	if (typeof mode === "function") return await mode<T>(res);

	try {
		switch (mode) {
			case null:
			case undefined:
			case "json":
				return await res.json();
			case "text":
				return (await res.text()) as T;
			case "blob":
				return (await res.blob()) as T;
			default:
				return await res.json();
		}
	} catch (error) {
		if (throwError) throw error;
		console.warn(new Error("failed to parse response", error));
		return null;
	}
};

const parseBody = async (body: unknown, mode: RequestParser): Promise<BodyInit> => {
	if (!body) return null;

	if (typeof mode === "function") return await mode(body);

	switch (mode) {
		case "json":
			return JSON.stringify(body);
		case "text":
			return body?.toString();
		default:
			return body as BodyInit;
	}
};

const resolveEndpoint = async (val: SpecifyOrCreateApi, apiUrlCreator: ApiUrlCreator) => {
	return typeof val === "function" ? await val(apiUrlCreator) : val;
};

const fetchEndpoint = async (url: Url, opts?: UseApiOptions) => {
	const method = opts?.method || (opts?.body ? Method.POST : Method.GET);

	const res = await resolveModule("Fetcher")(
		url,
		await parseBody(opts?.body, opts?.parse),
		opts?.mime,
		method,
		false,
		(command, args, result) => {
			void events.emit("on-did-command", { command, args, result });
		},
		opts?.abort,
	);

	if (res.status === 404) {
		const command = trimRoutePrefix(url);
		throw new DefaultError(`${t("command")} "${command}" ${t("not-found2").toLowerCase()}`);
	}

	return res;
};

/**
 * React Hook for making API calls with state management and lifecycle callbacks.
 * Provides automatic request state tracking, error handling, and various response parsing.
 *
 * @template T - The raw response type from the API
 * @template O - The mapped output type (defaults to T if no transformation)
 *
 * ## Basic usage
 * @example
 * ```tsx
 * const { call: cancelClone } = useApi({
 *   url: (api) => api.cancelClone(name),
 * });
 *
 * return <Button onClick={cancelClone}>Cancel Clone</Button>
 * ```
 *
 * ## Map data before using
 * @example
 * ```tsx
 * const {
 *		call: updateProgress,
 *		data: progress,
 *		reset,
 *	} = useApi<RemoteProgress, RemoteProgressPercentage>({
 *		url: (api) => api.getCloneProgress(catalogName),
 *		map: (data) => data ? { ...data, percentage: getPercent(data, firstReceived) } : null
 *	});
 *
 *	const { start: startUpdating, stop: stopUpdating } = useInterval(updateProgress, 1000);
 *
 *  useWatch(() => {
 *    ... // at this point progress includes percentage
 *  }, [progress])
 * ```
 */
export const useApi = <T, O = T>({ url: rawUrl, opts, parse, ...props }: UseApiProps<T, O>): UseApiResult<O> => {
	const { onStart, onDone, onError, onFinally, map } = props;

	const apiUrlCreator = ApiUrlCreatorService.value;

	const endpoint = useRef<Promise<Url>>(null);

	const callbacks = useRef<{
		onStart: OnStart;
		onDone: OnDone<O>;
		onError: OnError;
		onFinally: onFinally<O>;
		map: ResponseMap<T, O>;
	}>({
		onStart,
		onDone,
		onError,
		onFinally,
		map,
	});

	const [data, setData] = useState<O | null>();
	const [status, setStatus] = useState(RequestStatus.Init);
	const [error, setError] = useState<Error | null>(null);

	const statusRef = useRef(status);

	useWatch(() => {
		endpoint.current = resolveEndpoint(rawUrl, apiUrlCreator);
	}, [rawUrl, apiUrlCreator]);

	useWatch(() => {
		callbacks.current = {
			onStart,
			onDone,
			onError,
			onFinally,
			map,
		};
	}, [onStart, onDone, onError, onFinally, map]);

	useWatch(() => {
		statusRef.current = status;
	}, [status]);

	const call = useCallback(
		async (defer?: UseApiProps<T, O>) => {
			let cbs = callbacks.current;

			if (defer) {
				opts = {
					...opts,
					...defer.opts,
				};

				cbs = {
					onDone: defer.onDone || cbs.onDone,
					onError: defer.onError || cbs.onError,
					onFinally: defer.onFinally || cbs.onFinally,
					onStart: defer.onStart || cbs.onStart,
					map: defer.map || cbs.map,
				};

				endpoint.current = defer.url ? resolveEndpoint(defer.url, apiUrlCreator) : endpoint.current;
			}

			const url = await endpoint.current;

			if (statusRef.current === RequestStatus.Loading) {
				console.warn(new Error(`request '${url}' already in progress`));
				return;
			}

			if (!url) {
				console.warn(new Error(`request url isn't set`));
				return;
			}

			let data: O;
			let error: Error;

			setStatus(RequestStatus.Loading);
			await cbs.onStart?.();

			try {
				const res = await fetchEndpoint(url, opts);

				if (res.ok) {
					const temp = await parseResponse<T>(res, parse, opts?.failOnParse);
					data = (await cbs.map?.(temp)) || (temp as O);
					setData(data);
					setStatus(RequestStatus.Ready);
					await cbs.onDone?.(data);
					return data;
				}

				throw await parseResponse(res, "json", opts?.failOnParse);
			} catch (err) {
				error = err?.cause || err;
				setStatus(RequestStatus.Error);
				setError(error);
				await cbs.onError?.(error);

				if (!opts?.consumeError) ErrorConfirmService.notify(err);
			} finally {
				await cbs.onFinally?.(data, error);
			}
		},
		[opts, parse, apiUrlCreator],
	);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setStatus(RequestStatus.Init);
	}, []);

	useEffect(() => {
		if (props.auto) void call();
	}, [call, props.auto]);

	return {
		data,
		error,
		status,
		call,
		reset,
	};
};

export type UseDeferApiProps<T, O> = Omit<UseApiProps<T, O>, "url"> & { url?: SpecifyOrCreateApi };
export type UseDeferApiResult<T, O> = UseApiResult<O> & {
	call: (defer?: UseDeferApiProps<T, O>) => Promise<O>;
};

export const useDeferApi = <T, O = T>(props: UseDeferApiProps<T, O>): UseDeferApiResult<T, O> => {
	return useApi<T, O>(props as UseApiProps<T, O>) as UseDeferApiResult<T, O>;
};

export const events = createEventEmitter<UseApiEvents>();

export const useApiEvent = <E extends keyof UseApiEvents, C extends UseApiEvents[E]>(event: E, callback: C) => {
	useEffect(() => {
		const token = events.on(event, callback);
		return () => events.off(token);
	}, [event, callback]);
};
