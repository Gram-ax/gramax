import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import PrintView from "@ext/print/components/PrintView";
import { CliOnProgress, PdfExportProgress, PdfPrintParams } from "@ext/print/types";
import { useEffect } from "react";

const wrapCliOnProgress = (cliOnProgress?: CliOnProgress) => (p: PdfExportProgress) => {
	if (p?.cliMessage) {
		cliOnProgress?.(p.cliMessage);
	}
};

const usePrintHandler = (isFirstLoad: boolean) => {
	const catalogProps = useCatalogPropsStore((state) => state.data);
	const apiUrlCreator = ApiUrlCreatorService.value;

	useEffect(() => {
		if (!isFirstLoad) return;
		const printCatalog = (
			onProgress?: CliOnProgress,
			params: PdfPrintParams = { titlePage: true, tocPage: true, titleNumber: true },
		) => {
			const progressBridge = wrapCliOnProgress(onProgress);

			ArticleViewService.setBottomView(() => (
				<PrintView
					apiUrlCreator={apiUrlCreator}
					catalogProps={catalogProps}
					isCategory={true}
					itemPath={null}
					onProgress={progressBridge}
					openPrint={false}
					params={params}
					throttleUnits={1}
				/>
			));
		};
		(window as any).gramaxPrintCatalog = printCatalog;
	}, [isFirstLoad]);
};

export default usePrintHandler;
