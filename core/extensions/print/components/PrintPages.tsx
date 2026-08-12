import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
// biome-ignore lint/style/noRestrictedImports: PDF print layout still relies on dynamic scoped Emotion styles.
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import { ArticlePrintPreview } from "@ext/print/components/ArticlePrintPreview";
import type { StartPaginationFunction } from "@ext/print/components/hooks/usePaginationTask";
import { useGetItems } from "@ext/print/components/useGetItems";
import type { PdfExportProgress, PdfPrintParams } from "@ext/print/types";
import { waitForPrintableContent } from "@ext/print/utils/pagination/nodeHandlers";
import PagePaginator from "@ext/print/utils/pagination/PagePaginator";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";

const StyledPrintBody = styled.div<{ title: string; titlePageExist: boolean; tocPageTitle: string }>`
	--title: "${(p) => p.title}";
	--toc-page-title: "${(p) => p.tocPageTitle}";

	counter-reset: page 0;
	.page {
		counter-increment: page;
	}
	.page > .page-bottom > .page-bottom-right::before {
		content: counter(page);
	}
`;

type PrintPagesProps = {
	itemPath?: string;
	isCategory?: boolean;
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	params: PdfPrintParams;
	onProgress?: (progress: PdfExportProgress) => void;
	onStartPagination: StartPaginationFunction;
	onCancelPagination?: () => void;
	exportSignal?: AbortSignal;
};

const PrintPages = memo(
	({
		itemPath,
		isCategory,
		catalogProps,
		apiUrlCreator,
		params,
		onProgress,
		onStartPagination,
		onCancelPagination,
		exportSignal,
	}: PrintPagesProps) => {
		const containerDivRef = useRef<HTMLDivElement>(null);
		const renderDivRef = useRef<HTMLDivElement>(null);
		const printDivRef = useRef<HTMLDivElement>(null);

		const { printableContent } = useGetItems(
			catalogProps.name,
			apiUrlCreator,
			onProgress,
			isCategory,
			itemPath,
			params.titleNumber,
			params.template,
		);
		const components = useMemo(getComponents, []);

		useEffect(() => {
			const docTitle = document.title;
			const printableContentTitle = printableContent.title;
			document.title = printableContentTitle;
			return () => {
				if (document.title === printableContentTitle) document.title = docTitle;
			};
		}, [printableContent.title]);

		useWatch(() => {
			const setTemplate = () => {
				const template = document.createElement("style");
				template.textContent = printableContent.template;
				containerDivRef.current.appendChild(template);
			};

			if (printableContent.template && containerDivRef.current) setTemplate();
		}, [printableContent.template]);

		useWatch(() => {
			if (renderDivRef.current) PagePaginator.setUsablePageWidth(renderDivRef.current);
		}, [renderDivRef.current]);

		const handleLastRender = useCallback(async () => {
			if (!renderDivRef.current || !printDivRef.current || printableContent.items.length === 0) return;
			if (exportSignal?.aborted) return;

			// React reports the article as rendered the moment it has created the elements; a block whose
			// content arrives later is still empty then, and measuring now would size pages against a skeleton.
			await waitForPrintableContent(renderDivRef.current, exportSignal);
			if (exportSignal?.aborted) return;

			onProgress({
				stage: "exporting",
				ratio: 0.03,
				cliMessage: "done-render",
			});
			onStartPagination(renderDivRef.current, printDivRef.current, printableContent, { signal: exportSignal });
		}, [exportSignal, printableContent, onProgress, onStartPagination]);

		useEffect(
			() => () => {
				onCancelPagination?.();
			},
			[onCancelPagination],
		);

		return (
			<div ref={containerDivRef}>
				<CatalogStoreProvider data={catalogProps}>
					<div className="render-body">
						<div className="page">
							<div className="page-content" ref={renderDivRef}>
								{printableContent.items.map((item, i) => (
									<ArticlePrintPreview
										components={components}
										item={item}
										key={item.logicPath}
										onRender={
											i === printableContent.items.length - 1 ? handleLastRender : undefined
										}
									/>
								))}
							</div>
						</div>
					</div>
				</CatalogStoreProvider>
				<StyledPrintBody
					className="print-body"
					ref={printDivRef}
					title={printableContent.title}
					titlePageExist={params.titlePage}
					tocPageTitle={params.tocPageTitle ?? t("export.pdf.tocPageTitle")}
				/>
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.itemPath === nextProps.itemPath && prevProps.catalogProps === nextProps.catalogProps;
	},
);

export default PrintPages;
