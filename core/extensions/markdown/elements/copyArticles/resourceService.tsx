import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import fileNameUtils from "@core-ui/fileNameUtils";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import Path from "@core/FileProvider/Path/Path";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import getArticleFileBrotherNames from "@ext/markdown/elementsUtils/AtricleResource/getAtricleResourceNames";
import { ReactElement, createContext, useCallback, useContext, useEffect, useState } from "react";

type UseGetResource = (callback: (buffer: Buffer) => void, src: string, content?: string) => void;

type SetResource = (name: string, file: string | Buffer, path?: string, force?: boolean) => Promise<string>;

type DeleteResource = (src: string) => Promise<void>;

type ResourceData = Record<string, Buffer>;

export type ResourceServiceType = {
	data: ResourceData;
	id?: string;
	provider?: ArticleProviderType;
	useGetResource: UseGetResource;
	setResource: SetResource;
	deleteResource: DeleteResource;
	getBuffer: (src: string) => Buffer;
	clear: () => void;
	update: (src: string, buffer: Buffer) => void;
};

const ResourceServiceContext = createContext<ResourceServiceType>({
	data: {},
	id: undefined,
	provider: undefined,
	useGetResource: () => {},
	deleteResource: async () => {},
	setResource: async () => Promise.resolve(""),
	getBuffer: () => Buffer.from(""),
	clear: () => {},
	update: () => {},
});

type ResourceServiceProps = {
	children: ReactElement;
	id?: string;
	provider?: ArticleProviderType;
};

abstract class ResourceService {
	static Provider({ children, provider, id }: ResourceServiceProps) {
		const [data, setData] = useState<ResourceData>({});
		const catalogName = CatalogPropsService.value?.name;
		const articleProps = ArticlePropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;

		const clear = useCallback(() => {
			setData({});
		}, [setData]);

		useEffect(() => {
			if (!id) return;
			clear();
		}, [id]);

		const update = useCallback(
			(src: string, buffer: Buffer) => {
				setData((prevData) => ({ ...prevData, [src]: buffer }));
			},
			[data, setData],
		);

		const useGetResource = (callback: (buffer: Buffer) => void, src: string, content?: string) => {
			const fetchImage = async (src: string) => {
				const res = await fetch(src);
				if (!res.ok) return;

				const blob = await res.blob();
				return new Uint8Array(await blob.arrayBuffer());
			};

			const fetchInTauri = async (src) => {
				const res = await resolveModule("httpFetch")({ url: src });
				if (!res?.body || res.body.type !== "binary") return;
				return res.body.data;
			};

			const loadExternalData = async (src: string) => {
				const buffer = getExecutingEnvironment() === "tauri" ? fetchInTauri(src) : fetchImage(src);
				return Buffer.from(await buffer);
			};

			const loadInternalData = async (src: string) => {
				const url = apiUrlCreator.getArticleResource(src, undefined, catalogName, id, provider);

				const res = await FetchService.fetch(url, undefined, MimeTypes.text, Method.POST, false);

				if (!res.ok) return;
				return await res.buffer();
			};

			const loadData = async (src: string) => {
				const buffer = isExternalLink(src).isExternal
					? await loadExternalData(src)
					: await loadInternalData(src);

				if (!buffer || !buffer.length) return callback(undefined);
				update(src, buffer);
			};

			useEffect(() => {
				if (content) callback(Buffer.from(content));
				else if (data?.[src]) callback(data[src]);
				else loadData(src);
			}, [src, data?.[src], content]);
		};

		const setResource: SetResource = useCallback(
			async (name, file, path, force) => {
				const pathedName = new Path(name);
				const extension = pathedName.extension;

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
			[setData, apiUrlCreator, articleProps?.fileName, update, provider, id],
		);

		const deleteResource: DeleteResource = useCallback(
			async (src: string) => {
				const url = apiUrlCreator.deleteArticleResource(src, id, provider);
				await FetchService.fetch(url);
			},
			[setData, apiUrlCreator, provider, id],
		);

		const getBuffer = useCallback(
			(src: string): Buffer => {
				return data?.[src];
			},
			[data],
		);

		return (
			<ResourceServiceContext.Provider
				value={{ data, id, provider, useGetResource, setResource, deleteResource, getBuffer, clear, update }}
			>
				{children}
			</ResourceServiceContext.Provider>
		);
	}

	static get value(): ResourceServiceType {
		return useContext(ResourceServiceContext);
	}
}

export default ResourceService;
