import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { useRouter } from "@core/Api/useRouter";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { ArticlePreview, PdfExportProgress, PrintableContent, PrintablePage } from "@ext/print/types";
import { useCallback, useEffect, useState } from "react";

export const useGetItems = (
	catalogName: string,
	apiUrlCreator: ApiUrlCreator,
	onProgress: (progress: PdfExportProgress) => void,
	isCategory?: boolean,
	itemPath?: string,
	titleNumber?: boolean,
	templateName?: string,
) => {
	const router = useRouter();
	const [printableContent, setPrintableContent] = useState<PrintableContent<ArticlePreview> & { template: string }>({
		items: [],
		title: "",
		template: "",
	});

	const loadItems = useCallback(async () => {
		onProgress({
			stage: "exporting",
			ratio: 0.01,
			cliMessage: "start-data-load",
		});
		let template = "";
		if (templateName) {
			const response = await FetchService.fetch(apiUrlCreator.getPdfTemplateUrl(templateName));
			if (response.ok) template = await response.text();
		}
		const response = await FetchService.fetch<PrintableContent<PrintablePage>>(
			apiUrlCreator.getPrintableContentUrl(catalogName, isCategory, itemPath, titleNumber),
		);
		if (!response.ok) {
			onProgress({
				stage: "cancelled",
				cliMessage: "error-data-load",
			});
			return;
		}

		const printableContent = await response.json();
		const { items, title } = printableContent;
		const result = items.map((item) => ({
			title: item.title,
			level: item.level,
			content: (item.content as Tag).children,
			logicPath: item.logicPath,
			apiUrlCreator: new ApiUrlCreator(router.basePath, catalogName, item.itemRefPath),
		}));
		setPrintableContent({ items: result, title, template });

		onProgress({
			stage: "exporting",
			ratio: 0.02,
		});
		onProgress({
			stage: "exporting",
			ratio: 0.02,
		});
	}, [apiUrlCreator, catalogName, isCategory, itemPath, router.basePath, titleNumber]);

	useEffect(() => {
		loadItems();
	}, [loadItems]);

	return {
		printableContent,
	};
};
