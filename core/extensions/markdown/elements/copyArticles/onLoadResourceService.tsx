import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useEffect, useState } from "react";

type OnLoadResource = ResourceData;

type ResourceData = { [key: string]: Buffer };

const OnLoadResourceContext = createContext<OnLoadResource>(undefined);

let _setData: Dispatch<SetStateAction<ResourceData>> = () => {};
let _data: ResourceData = {};

abstract class OnLoadResourceService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [data, setData] = useState<ResourceData>({});
		_setData = setData;
		_data = data;

		return <OnLoadResourceContext.Provider value={data}>{children}</OnLoadResourceContext.Provider>;
	}

	static get value(): OnLoadResource {
		return useContext(OnLoadResourceContext);
	}

	static getBuffer(src: string): Buffer {
		return _data?.[src];
	}

	static useGetContent(
		src: string,
		apiUrlCreator: ApiUrlCreator,
		callback: (buffer: Buffer) => void,
		content?: string,
		readFromHead?: boolean,
	) {
		const data = this.value;

		const loadData = async (src: string, readFromHead?: boolean) => {
			const url = apiUrlCreator.getArticleResource(src, undefined, readFromHead);
			const res = await FetchService.fetch(url);
			if (!res.ok) return;

			const buffer = await res.buffer();
			this.update(src, buffer);
			if (buffer.length) callback(buffer);

			return buffer;
		};

		useEffect(() => {
			if (content) callback(Buffer.from(content));
			else if (data?.[src]) callback(data[src]);
			else loadData(src, readFromHead);
		}, [src, data?.[src], content]);
	}

	static clear() {
		_data = {};
		_setData({});
	}

	static update(src: string, buffer: Buffer) {
		const newData = { ..._data };
		newData[src] = buffer;
		_data = newData;
		_setData(newData);
	}
}

export default OnLoadResourceService;
