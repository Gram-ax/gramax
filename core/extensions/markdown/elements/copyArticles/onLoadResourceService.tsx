import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import Path from "@core/FileProvider/Path/Path";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { ReactElement, createContext, useCallback, useContext, useEffect, useState } from "react";

export type OnLoadResource = {
	data: ResourceData;
	useGetContent: (
		src: string,
		apiUrlCreator: ApiUrlCreator,
		callback: (buffer: Buffer) => void,
		content?: string,
	) => void;
	getBuffer: (src: string) => Buffer;
	clear: () => void;
	update: (src: string, buffer: Buffer) => void;
};

type ResourceData = { [key: string]: Buffer };

const OnLoadResourceContext = createContext<OnLoadResource>({
	data: {},
	useGetContent: () => {},
	getBuffer: () => Buffer.from(""),
	clear: () => {},
	update: () => {},
});

abstract class OnLoadResourceService {
	static Provider({ children, scope }: { children: ReactElement; scope?: TreeReadScope }) {
		const [data, setData] = useState<ResourceData>({});
		const catalogName = CatalogPropsService.value?.name;

		const clear = useCallback(() => {
			setData({});
		}, [setData]);

		const update = useCallback(
			(src: string, buffer: Buffer) => {
				setData((prevData) => ({ ...prevData, [src]: buffer }));
			},
			[data, setData],
		);

		const useGetContent = (
			src: string,
			apiUrlCreator: ApiUrlCreator,
			callback: (buffer: Buffer) => void,
			content?: string,
		) => {
			const loadData = async (src: string) => {
				const scopedCatalogName = scope
					? GitTreeFileProvider.scoped(new Path(catalogName), scope, undefined, true).value
					: undefined;
				const url = apiUrlCreator.getArticleResource(src, undefined, scopedCatalogName);
				const res = await FetchService.fetch(url);
				if (!res.ok) return callback(undefined);

				const buffer = await res.buffer();
				if (!buffer || !buffer.length) return callback(undefined);
				update(src, buffer);
			};

			useEffect(() => {
				if (content) callback(Buffer.from(content));
				else if (data?.[src]) callback(data[src]);
				else loadData(src);
			}, [src, data?.[src], content]);
		};
		const getBuffer = useCallback(
			(src: string): Buffer => {
				return data?.[src];
			},
			[data],
		);

		return (
			<OnLoadResourceContext.Provider value={{ data, useGetContent, getBuffer, clear, update }}>
				{children}
			</OnLoadResourceContext.Provider>
		);
	}

	static get value(): OnLoadResource {
		return useContext(OnLoadResourceContext);
	}
}

export default OnLoadResourceService;
