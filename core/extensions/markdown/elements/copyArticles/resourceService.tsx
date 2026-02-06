import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import Path from "@core/FileProvider/Path/Path";
import { isLikelyLfsPointer } from "@core/GitLfs/utils";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import fileNameUtils from "@core-ui/fileNameUtils";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import {
	LfsPointerError,
	type ResourceError,
	ResourceLoadError,
	ResourceNotFoundError,
} from "@ext/markdown/elements/copyArticles/errors/ResourceError";
import { useResourceStore } from "@ext/markdown/elements/copyArticles/store/ResourceStore";
import getArticleFileBrotherNames from "@ext/markdown/elementsUtils/AtricleResource/getAtricleResourceNames";
import { createContext, type ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";

type ResourceCallback = (buffer: Buffer | undefined, error?: ResourceError) => void | Promise<void>;

type UseGetResource = (
	callback: ResourceCallback,
	src: string,
	content?: string,
	haveParentPath?: boolean,
	isPrint?: boolean,
) => void;

type SetResource = (name: string, file: string | Buffer, path?: string, force?: boolean) => Promise<string>;

type DeleteResource = (src: string) => Promise<void>;

type ResourceData = Record<string, Buffer>;

export interface ResourceServiceType {
	data: ResourceData;
	id?: string;
	provider?: ArticleProviderType;
	useGetResource: UseGetResource;
	getResource: (src: string) => Promise<{ buffer?: Buffer; error?: ResourceError }>;
	setResource: SetResource;
	deleteResource: DeleteResource;
	getBuffer: (src: string) => Buffer;
	clear: () => void;
	update: (src: string, buffer: Buffer) => void;
}

const ResourceServiceContext = createContext<ResourceServiceType>({
	data: {},
	id: undefined,
	provider: undefined,
	useGetResource: () => {},
	getResource: () => Promise.resolve({}),
	deleteResource: () => Promise.resolve(),
	setResource: () => Promise.resolve(""),
	getBuffer: () => Buffer.from(""),
	clear: () => {},
	update: () => {},
});

interface ResourceServiceProps {
	children: ReactElement;
	id?: string;
	provider?: ArticleProviderType;
}

abstract class ResourceService {
	private static _loadingPromises: Set<Promise<void>> = new Set();

	static Provider({ children, provider, id }: ResourceServiceProps) {
		const [localData, setLocalData] = useState<ResourceData>({});
		const catalogName = useCatalogPropsStore((state) => state.data?.name);
		const articleProps = ArticlePropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;

		const storeData = useResourceStore((state) => state.data);
		const updateStore = useResourceStore((state) => state.update);
		const clearStore = useResourceStore((state) => state.clear);

		const data = id ? localData : storeData;

		const clear = useCallback(() => {
			if (id) {
				setLocalData({});
			} else {
				clearStore();
			}
		}, [id, clearStore]);

		useEffect(() => {
			if (!id) return;
			setLocalData({});
		}, [id]);

		const update = useCallback(
			(src: string, buffer: Buffer) => {
				if (id) {
					setLocalData((prevData) => ({ ...prevData, [src]: buffer }));
				} else {
					updateStore(src, buffer);
				}
			},
			[id, updateStore],
		);

		const checkLfsPointer = (buffer: Buffer, src: string): ResourceError | undefined => {
			if (isLikelyLfsPointer(buffer)) return new LfsPointerError(src);
			return undefined;
		};

		const getResource = useCallback(
			async (src: string): Promise<{ buffer?: Buffer; error?: ResourceError }> => {
				if (data?.[src]) {
					const buffer = data[src];
					const lfsError = checkLfsPointer(buffer, src);
					if (lfsError) return { error: lfsError };
					return { buffer };
				}

				const url = apiUrlCreator.getArticleResource(src, undefined, catalogName, id, provider);

				try {
					const res = await FetchService.fetch(url, undefined, MimeTypes.text, Method.POST, false);

					if (!res.ok) {
						return { error: new ResourceNotFoundError(src) };
					}

					const buffer = await res.buffer();
					const lfsError = checkLfsPointer(buffer, src);
					if (lfsError) return { error: lfsError };

					return { buffer };
				} catch (e) {
					return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
				}
			},
			[data, apiUrlCreator, catalogName, id, provider],
		);

		const getNoParentResource = useCallback(
			async (fullResourcePath: Path): Promise<{ buffer?: Buffer; error?: ResourceError }> => {
				const url = apiUrlCreator.getResourceByPath(fullResourcePath.value);

				try {
					const res = await FetchService.fetch(url, undefined, MimeTypes.text, Method.POST, false);

					if (!res.ok) {
						return { error: new ResourceNotFoundError(fullResourcePath.value) };
					}

					const buffer = await res.buffer();
					const lfsError = checkLfsPointer(buffer, fullResourcePath.value);
					if (lfsError) return { error: lfsError };

					return { buffer };
				} catch (e) {
					return { error: new ResourceLoadError(fullResourcePath.value, e instanceof Error ? e : undefined) };
				}
			},
			[apiUrlCreator],
		);

		const useGetResource: UseGetResource = (callback, src, content?, haveParentPath = true, isPrint?) => {
			const resolvePromiseRef = useRef<(() => void) | null>(null);
			const promiseRef = useRef<Promise<void> | null>(null);

			useEffect(() => {
				if (!isPrint) return;
				promiseRef.current = new Promise<void>((resolve) => {
					resolvePromiseRef.current = resolve;
				});
				ResourceService._loadingPromises.add(promiseRef.current);
				promiseRef.current.finally(() => ResourceService._loadingPromises.delete(promiseRef.current));

				return () => {
					resolvePromiseRef.current();
				};
			}, []);

			const fetchImage = async (src: string): Promise<{ buffer?: Buffer; error?: ResourceError }> => {
				try {
					const res = await fetch(src);
					if (!res.ok) {
						return { error: new ResourceNotFoundError(src) };
					}

					const blob = await res.blob();
					const buffer = Buffer.from(new Uint8Array(await blob.arrayBuffer()));
					return { buffer };
				} catch (e) {
					return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
				}
			};

			const fetchInTauri = async (src: string): Promise<{ buffer?: Buffer; error?: ResourceError }> => {
				try {
					const res = await resolveModule("httpFetch")({ url: src });
					if (!res?.body || res.body.type !== "binary") {
						return { error: new ResourceNotFoundError(src) };
					}
					return { buffer: Buffer.from(res.body.data) };
				} catch (e) {
					return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
				}
			};

			const loadExternalData = async (src: string): Promise<{ buffer?: Buffer; error?: ResourceError }> => {
				const result = getExecutingEnvironment() === "tauri" ? await fetchInTauri(src) : await fetchImage(src);
				return result;
			};

			const loadInternalData = async (src: string): Promise<{ buffer?: Buffer; error?: ResourceError }> => {
				const url = apiUrlCreator.getArticleResource(src, undefined, catalogName, id, provider);

				try {
					const res = await FetchService.fetch(url, undefined, MimeTypes.text, Method.POST, false);

					if (!res.ok) {
						return { error: new ResourceNotFoundError(src) };
					}

					const buffer = await res.buffer();
					const lfsError = checkLfsPointer(buffer, src);
					if (lfsError) return { error: lfsError };

					return { buffer };
				} catch (e) {
					return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
				}
			};

			const wrappedCallback = useCallback(
				async (buffer: Buffer | undefined, error?: ResourceError) => {
					try {
						await Promise.resolve(callback(buffer, error));
					} finally {
						resolvePromiseRef.current?.();
					}
				},
				[callback, isPrint],
			);

			const loadData = async (src: string) => {
				let result: { buffer?: Buffer; error?: ResourceError };

				try {
					if (!haveParentPath) {
						result = await getNoParentResource(new Path(src));
					} else {
						result = isExternalLink(src).isUrl ? await loadExternalData(src) : await loadInternalData(src);
					}
				} catch (e) {
					const error = new ResourceLoadError(src, e instanceof Error ? e : undefined);
					if (isPrint) wrappedCallback(undefined, error);
					throw e;
				}

				if (result.error) {
					return wrappedCallback(undefined, result.error);
				}

				if (!result.buffer || !result.buffer.length) {
					return wrappedCallback(undefined, new ResourceNotFoundError(src));
				}

				update(src, result.buffer);
			};

			useEffect(() => {
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
			}, [src, data?.[src], content]);
		};

		const setResource: SetResource = useCallback(
			async (name, file, path, force) => {
				const pathedName = new Path(name);
				const extension = pathedName.extension?.toLowerCase();

				const names = force ? [] : await getArticleFileBrotherNames(apiUrlCreator, id, provider);
				const newName = fileNameUtils.getNewName(names, pathedName.name ?? articleProps.fileName, extension);

				const fullResourcePath = new Path([path, newName]);
				const url = apiUrlCreator.setArticleResource(fullResourcePath.value, id, provider);

				const res = await FetchService.fetch(url, file, MimeTypes.text);
				if (!res.ok) return;

				update(newName, typeof file == "string" ? Buffer.from(file) : file);

				names.push(newName);

				return newName;
			},
			[apiUrlCreator, articleProps?.fileName, update, provider, id],
		);

		const deleteResource: DeleteResource = useCallback(
			async (src: string) => {
				const url = apiUrlCreator.deleteArticleResource(src, id, provider);
				await FetchService.fetch(url);
			},
			[apiUrlCreator, provider, id],
		);

		const getBuffer = useCallback(
			(src: string): Buffer => {
				return data?.[src];
			},
			[data],
		);

		return (
			<ResourceServiceContext.Provider
				value={{
					data,
					id,
					provider,
					useGetResource,
					getResource,
					setResource,
					deleteResource,
					getBuffer,
					clear,
					update,
				}}
			>
				{children}
			</ResourceServiceContext.Provider>
		);
	}

	static get value(): ResourceServiceType {
		return useContext(ResourceServiceContext);
	}

	static async waitForAllLoads(signal?: AbortSignal) {
		const yieldThread = () =>
			new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});

		while (ResourceService._loadingPromises.size) {
			if (signal?.aborted) return;
			const pending = Array.from(ResourceService._loadingPromises);
			await Promise.race([Promise.allSettled(pending), yieldThread()]);
		}
	}
}

export default ResourceService;
