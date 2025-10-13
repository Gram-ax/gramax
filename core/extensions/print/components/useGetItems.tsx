import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { useRouter } from "@core/Api/useRouter";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { ArticlePreview, PrintablePage } from "@ext/print/types";
import { useEffect, useState } from "react";

export const useGetItems = (
	catalogName: string,
	apiUrlCreator: ApiUrlCreator,
	isCategory?: boolean,
	itemPath?: string,
	titleNumber?: boolean,
) => {
	const router = useRouter();
	const [items, setItems] = useState<ArticlePreview[]>([]);

	const loadItems = async () => {
		const response = await FetchService.fetch<PrintablePage[]>(
			apiUrlCreator.getPrintableContentUrl(catalogName, isCategory, itemPath, titleNumber),
		);
		if (!response.ok) return;

		const items = await response.json();
		const result = items.map((item) => ({
			title: item.title,
			level: item.level,
			content: (item.content as Tag).children,
			apiUrlCreator: new ApiUrlCreator(router.basePath, catalogName, item.itemRefPath),
		}));
		setItems(result);
	};

	useEffect(() => {
		loadItems();
	}, [catalogName, itemPath]);

	return {
		items,
	};
};
