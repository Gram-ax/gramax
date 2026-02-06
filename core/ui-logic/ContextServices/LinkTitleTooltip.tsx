import { useApi } from "@core-ui/hooks/useApi";
import LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import { LevelTocItem } from "@ext/navigation/article/logic/createTocItems";
import { useState } from "react";

export type TitleItem = {
	url: string;
	title: string;
	level: number;
	items?: TitleItem[];
};

export type FetchArticleHeadersProps = {
	linkItem: LinkItem;
};

export const useFetchArticleHeaders = ({ linkItem }: FetchArticleHeadersProps) => {
	const [isLoading, dispatchIsLoading] = useState(false);
	const [headers, dispatchHeaders] = useState([]);

	const { call: getArticleHeadersByRelativePath } = useApi<LevelTocItem[]>({
		url: (api) => api.getArticleHeadersByRelativePath(linkItem.relativePath),
	});

	const fetchArticleHeaders = async () => {
		try {
			dispatchIsLoading(true);
			const headers = (await getArticleHeadersByRelativePath()) || [];
			dispatchHeaders(headers);
		} catch (e) {
			console.error(e);
		} finally {
			dispatchIsLoading(false);
		}
	};

	return { fetchArticleHeaders, isLoading, headers };
};
