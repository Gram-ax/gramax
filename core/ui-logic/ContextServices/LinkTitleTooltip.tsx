import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import eventEmitter from "@core/utils/eventEmmiter";
import LinkItem from "@ext/artilce/LinkCreator/models/LinkItem";
import { LevelTocItem } from "@ext/navigation/article/logic/createTocItems";
import { MutableRefObject, createContext, useContext, useRef, useState } from "react";

interface LinkTitleContextProps {
	apiUrlCreator: ApiUrlCreator;
	parentRef: MutableRefObject<any>;
	onMouseEnter: (item: LinkItem) => void;
}

const LinkTitleTooltipContext = createContext<LinkTitleContextProps>({
	apiUrlCreator: undefined,
	parentRef: null,
	onMouseEnter: () => {},
});

export type TitleItem = {
	url: string;
	title: string;
	level: number;
	items?: TitleItem[];
};

export type FetchArticleHeadersProps = {
	apiUrlCreator: ApiUrlCreator;
	linkItem: LinkItem;
};

export const useFetchArticleHeaders = ({ apiUrlCreator, linkItem }: FetchArticleHeadersProps) => {
	const [isLoading, dispatchIsLoading] = useState(false);
	const [headers, dispatchHeaders] = useState([]);

	const itemClickHandler = (item: TitleItem) => {
		const path = linkItem.relativePath + item.url;
		const href = linkItem.pathname + item.url;

		eventEmitter.emit("itemTitleLinkClick", { path, href });
	};

	const fetchArticleHeaders = async () => {
		const relativePath = linkItem.relativePath;

		try {
			dispatchIsLoading(true);
			const url = apiUrlCreator.getArticleHeadersByRelativePath(relativePath);

			const response = await FetchService.fetch<LevelTocItem[]>(url);
			if (!response?.ok) return;

			const headers = await response.json();
			dispatchHeaders(headers);
		} catch (e) {
			console.error(e);
		} finally {
			dispatchIsLoading(false);
		}
	};

	return { fetchArticleHeaders, isLoading, headers, itemClickHandler };
};

abstract class LinkTitleContextService {
	static Provider({ children, apiUrlCreator }: { children: JSX.Element; apiUrlCreator: ApiUrlCreator }): JSX.Element {
		const activeItem = useRef(null);
		const parentRef = useRef(null);

		const onMouseEnter = (item: LinkItem) => {
			if (activeItem.current !== item) {
				eventEmitter.emit("closeTitleTooltip");
				activeItem.current = item;
			}
		};

		return (
			<LinkTitleTooltipContext.Provider value={{ apiUrlCreator, parentRef, onMouseEnter }}>
				{children}
			</LinkTitleTooltipContext.Provider>
		);
	}

	static get value() {
		return useContext(LinkTitleTooltipContext);
	}
}

export default LinkTitleContextService;
