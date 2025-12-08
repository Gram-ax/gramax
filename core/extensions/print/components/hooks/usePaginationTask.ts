import { useCallback, useEffect, useRef, useState } from "react";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import paginateIntoPages from "@ext/print/utils/paginateIntoPages";
import { waitForNextPaint } from "@ext/print/utils/pagination/scheduling";
import { ArticlePreview, PdfExportProgress, PdfPrintParams, PrintableContent } from "@ext/print/types";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { isPaginationAbortError } from "@ext/print/utils/pagination/abort";

interface UsePaginationTaskArgs {
	apiUrlCreator: ApiUrlCreator;
	params: PdfPrintParams;
	onProgress?: (progress: PdfExportProgress) => void;
	onDone?: VoidFunction;
	onError?: (error: unknown) => void;
	externalSignal?: AbortSignal;
	throttleUnits?: number;
}

export type StartPaginationFunction = (
	renderRoot: HTMLElement,
	printRoot: HTMLElement,
	items: PrintableContent<ArticlePreview>,
	options?: { signal?: AbortSignal },
) => Promise<void>;

export interface CancelOptions {
	silent?: boolean;
}
const linkAbortSignal = (controller: AbortController, signal?: AbortSignal) => {
	if (!signal) return () => {};
	if (signal.aborted) {
		controller.abort(signal.reason);
		return () => {};
	}
	const abortListener = () => controller.abort(signal.reason);
	signal.addEventListener("abort", abortListener);
	const cleanup = () => signal.removeEventListener("abort", abortListener);
	controller.signal.addEventListener("abort", cleanup, { once: true });
	return cleanup;
};

export const usePaginationTask = ({
	apiUrlCreator,
	params,
	onProgress,
	onDone,
	onError,
	externalSignal,
	throttleUnits,
}: UsePaginationTaskArgs) => {
	const controllerRef = useRef<AbortController | null>(null);
	const [isRunning, setIsRunning] = useState(false);

	const cancel = useCallback(() => {
		const controller = controllerRef.current;
		if (!controller) return;
		controller.abort();
		controllerRef.current = null;
		setIsRunning(false);
	}, []);

	const start = useCallback<StartPaginationFunction>(
		async (renderRoot, printRoot, items, options) => {
			if (!renderRoot || !printRoot) return;

			const existing = controllerRef.current;
			if (existing && !existing.signal.aborted) {
				return;
			}

			cancel();

			const controller = new AbortController();
			controllerRef.current = controller;
			const linkedSignals = [externalSignal, options?.signal].map((signal) =>
				linkAbortSignal(controller, signal),
			);

			try {
				setIsRunning(true);

				await waitForNextPaint(controller.signal);
				await ResourceService.waitForAllLoads(controller.signal);
				await waitForNextPaint(controller.signal);

				onProgress?.({ stage: "exporting", ratio: 0.05 });

				await waitForNextPaint(controller.signal);

				await paginateIntoPages(renderRoot, printRoot, params, items, onDone, onProgress, {
					signal: controller.signal,
					throttleUnits,
				});
			} catch (error) {
				if (isPaginationAbortError(error)) {
					onProgress?.({ stage: "cancelled", ratio: 0 });
				} else {
					onError?.(error);
				}
			} finally {
				linkedSignals.forEach((cleanup) => cleanup());
				if (controllerRef.current === controller) {
					controllerRef.current = null;
				}
				setIsRunning(false);
			}
		},
		[apiUrlCreator, cancel, externalSignal, onDone, onError, onProgress, params],
	);

	useEffect(
		() => () => {
			cancel();
		},
		[cancel],
	);

	return {
		start,
		cancel,
		isRunning,
	};
};

export type UsePaginationTaskReturn = ReturnType<typeof usePaginationTask>;
