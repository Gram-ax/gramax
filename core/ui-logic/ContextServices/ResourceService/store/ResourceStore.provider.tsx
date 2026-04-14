import Path from "@core/FileProvider/Path/Path";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import {
	createResourceStore,
	type ResourceStoreState,
} from "@core-ui/ContextServices/ResourceService/store/ResourceStore";
import {
	checkLfsPointer,
	loadInternalData,
	type ResourceFetchResult,
} from "@core-ui/ContextServices/ResourceService/utils/utils";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

type SetResource = (name: string, file: string | Buffer, path?: string, force?: boolean) => Promise<string>;

type DeleteResource = (src: string) => Promise<void>;

type ResourceData = Record<string, Buffer>;

export interface ResourceServiceType {
	data: ResourceData;
	id?: string;
	provider?: ArticleProviderType;
	getResource: (src: string) => Promise<ResourceFetchResult>;
	setResource: SetResource;
	deleteResource: DeleteResource;
	getBuffer: (src: string) => Buffer;
	clear: () => void;
	update: (src: string, buffer: Buffer) => void;
}

export const ResourceServiceContext = createContext<ResourceServiceType>({
	data: {},
	id: undefined,
	provider: undefined,
	getResource: () => Promise.resolve({}),
	deleteResource: () => Promise.resolve(),
	setResource: () => Promise.resolve(""),
	getBuffer: () => Buffer.from(""),
	clear: () => {},
	update: () => {},
});

export type ResourceStoreApi = ReturnType<typeof createResourceStore>;

const ResourceStoreContext = createContext<ResourceStoreApi>(undefined);

export interface ResourceStoreProviderProps {
	children: ReactNode;
	id?: string;
	provider?: ArticleProviderType;
}

interface ResourceServiceProviderProps {
	children: ReactNode;
	id?: string;
	provider?: ArticleProviderType;
}

const ResourceServiceProvider = ({ children, id, provider }: ResourceServiceProviderProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	const { update, get, clear, data } = useResourceStore(
		(state) => ({ update: state.update, get: state.get, clear: state.clear, data: state.data }),
		"shallow",
	);

	const setResource: SetResource = useCallback(
		async (name, file, path, force) => {
			const fullResourcePath = new Path([path, name]);
			const url = apiUrlCreator.setArticleResource(fullResourcePath.value, id, provider, force);

			const res = await FetchService.fetch(url, file as unknown as BodyInit, MimeTypes.text);
			if (!res.ok) return;

			const json = await res.json();

			update(json.path, typeof file === "string" ? Buffer.from(file) : file);
			return json.path;
		},
		[apiUrlCreator, update, provider, id],
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
			return get(src);
		},
		[get],
	);

	const getResource = useCallback(
		async (src: string): Promise<ResourceFetchResult> => {
			const cached = get(src);

			if (cached) {
				const lfsError = checkLfsPointer(cached, src);
				if (lfsError) return { error: lfsError };
				return { buffer: cached };
			}

			return loadInternalData({
				src,
				apiUrlCreator,
				catalogName,
				id,
				provider,
			});
		},
		[id, provider, catalogName, apiUrlCreator, get],
	);

	return (
		<ResourceServiceContext.Provider
			value={{
				data,
				id,
				provider,
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
};

export const ResourceStoreProvider = (props: ResourceStoreProviderProps) => {
	const { children, id, provider } = props;
	const storeRef = useRef<ResourceStoreApi>(null);

	if (storeRef.current === null) {
		storeRef.current = createResourceStore({ id, provider });
	}

	useEffect(() => {
		storeRef.current.getState().reset(id, provider);
	}, [id, provider]);

	return (
		<ResourceStoreContext.Provider value={storeRef.current}>
			<ResourceServiceProvider id={id} provider={provider}>
				{children}
			</ResourceServiceProvider>
		</ResourceStoreContext.Provider>
	);
};

export const useResourceStore = <T,>(
	selector: (store: ResourceStoreState) => T,
	equalityFn?: ((a: T, b: T) => boolean) | "shallow",
): T => {
	const resourceStoreContext = useContext(ResourceStoreContext);

	if (!resourceStoreContext) {
		// Made for compatibility with the previous version of the context, which was called outside its context
		// Ideally, this should be investigated and fixed
		return selector({ data: undefined } as ResourceStoreState);
	}

	const actualEqualityFn = equalityFn === "shallow" ? shallow : equalityFn;

	return useStoreWithEqualityFn(resourceStoreContext, selector, actualEqualityFn);
};

export const useResourceStoreContext = () => useContext(ResourceStoreContext);
