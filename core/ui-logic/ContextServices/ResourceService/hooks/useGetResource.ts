import Path from "@core/FileProvider/Path/Path";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import {
	ResourceEmptyError,
	type ResourceError,
	ResourceLoadError,
	ResourceNotFoundError,
} from "@core-ui/ContextServices/ResourceService/errors";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import {
	useResourceStore,
	useResourceStoreContext,
} from "@core-ui/ContextServices/ResourceService/store/ResourceStore.provider";
import {
	checkLfsPointer,
	getNoParentResource,
	loadExternalData,
	loadInternalData,
	type ResourceFetchResult,
} from "@core-ui/ContextServices/ResourceService/utils/utils";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useCallback, useEffect, useMemo, useRef } from "react";

type ResourceCallback = (buffer: Buffer, error?: ResourceError) => void | Promise<void>;

type UseGetResource = (
	callback: ResourceCallback,
	src: string,
	content?: string,
	haveParentPath?: boolean,
	isPrint?: boolean,
	skipLoad?: boolean,
) => void;

const loadingSrcByStore = new WeakMap<object, Map<string, Promise<{ error: ResourceLoadError }>>>();

function getLoadingSrcForStore(store: object | undefined): Map<string, Promise<{ error: ResourceLoadError }>> {
	if (!store) return new Map();
	if (!loadingSrcByStore.has(store)) {
		loadingSrcByStore.set(store, new Map());
	}
	return loadingSrcByStore.get(store)!;
}

export const useGetResource: UseGetResource = (callback, src, content?, haveParentPath = true, isPrint?, skipLoad?) => {
	const store = useResourceStoreContext();
	const loadingPromises = useMemo(() => getLoadingSrcForStore(store), [store]);
	const resolvePromiseRef = useRef<() => void>(null);
	const promiseRef = useRef<Promise<void>>(null);
	const { data, id, provider, update } = useResourceStore(
		(state) => ({ data: state.data, id: state.id, provider: state.provider, update: state.update }),
		"shallow",
	);
	const apiUrlCreator = ApiUrlCreator.value;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	useEffect(() => {
		if (!isPrint) return;
		promiseRef.current = new Promise<void>((resolve) => {
			resolvePromiseRef.current = resolve;
		});
		ResourceService._loadingPromises.add(promiseRef.current);
		promiseRef.current.finally(() => ResourceService._loadingPromises.delete(promiseRef.current));

		return () => {
			resolvePromiseRef.current?.();
		};
	}, [isPrint]);

	const loadInternalDataCallback = useCallback(
		async (src: string): Promise<ResourceFetchResult> =>
			loadInternalData({ src, apiUrlCreator, catalogName, id, provider }),
		[id, provider, apiUrlCreator, catalogName],
	);

	const wrappedCallback = useCallback(
		async (buffer: Buffer | undefined, error?: ResourceError) => {
			try {
				await Promise.resolve(callback(buffer, error));
			} finally {
				resolvePromiseRef.current?.();
			}
		},
		[callback],
	);

	const setError = useCallback(
		(result: { error: ResourceLoadError }) => {
			if (!result?.error) return;
			wrappedCallback(undefined, result.error);
		},
		[wrappedCallback],
	);

	const tryLoadResource = useCallback(
		async (src: string) => {
			let result: { buffer?: Buffer; error?: ResourceError };
			try {
				if (!haveParentPath) {
					result = await getNoParentResource(new Path(src), apiUrlCreator);
				} else {
					result = isExternalLink(src).isUrl
						? await loadExternalData(src)
						: await loadInternalDataCallback(src);
				}
			} catch (e) {
				const error = new ResourceLoadError(src, e instanceof Error ? e : undefined);
				if (isPrint) return { error };
				throw e;
			} finally {
				loadingPromises.delete(src);
			}

			if (result.error) {
				return { error: result.error };
			}

			if (!result.buffer) {
				return { error: new ResourceNotFoundError(src) };
			}

			if (!result.buffer.length) {
				return { error: new ResourceEmptyError(src) };
			}

			update(src, result.buffer);
		},
		[update, haveParentPath, isPrint, apiUrlCreator, loadInternalDataCallback, loadingPromises],
	);

	const loadData = useCallback(
		async (src: string) => {
			if (!loadingPromises.has(src)) {
				const promise = tryLoadResource(src);

				loadingPromises.set(src, promise);
			}

			const result = await loadingPromises.get(src);
			setError(result);
		},
		[tryLoadResource, setError, loadingPromises],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (skipLoad) return;
		if (content) {
			wrappedCallback(Buffer.from(content));
			return;
		}

		if (data?.[src]) {
			const buffer = data[src];
			const lfsError = checkLfsPointer(buffer, src);
			if (lfsError) {
				wrappedCallback(undefined, lfsError);
			} else {
				wrappedCallback(buffer);
			}
			return;
		}

		loadData(src);
	}, [src, data?.[src], content, skipLoad]);
};
