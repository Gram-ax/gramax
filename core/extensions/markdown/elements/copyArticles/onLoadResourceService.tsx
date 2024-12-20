import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { ReactElement, createContext, useCallback, useContext, useEffect, useState } from "react";

export type OnLoadResource = {
	data: ResourceData;
	useGetContent: (
		src: string,
		apiUrlCreator: ApiUrlCreator,
		callback: (buffer: Buffer) => void,
		content?: string,
		readFromHead?: boolean,
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
	static Provider({ children }: { children: ReactElement }) {
		const [data, setData] = useState<ResourceData>({});

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
			readFromHead?: boolean,
		) => {
			const loadData = async (src: string, readFromHead?: boolean) => {
				const url = apiUrlCreator.getArticleResource(src, undefined, readFromHead);
				const res = await FetchService.fetch(url);
				if (!res.ok) return callback(undefined);

				const buffer = await res.buffer();
				if (!buffer || !buffer.length) return callback(undefined);
				update(src, buffer);
				callback(buffer);
				return buffer;
			};

			useEffect(() => {
				if (content) callback(Buffer.from(content));
				else if (data?.[src]) callback(data[src]);
				else loadData(src, readFromHead);
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
