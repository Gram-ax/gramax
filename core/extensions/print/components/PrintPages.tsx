import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import { ArticlePrintPreview } from "@ext/print/components/ArticlePrintPreview";
import { StartPaginationFunction } from "@ext/print/components/hooks/usePaginationTask";
import { useGetItems } from "@ext/print/components/useGetItems";
import { PdfExportProgress, PdfPrintParams } from "@ext/print/types";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";

const StyledPrintBody = styled.div<{ title: string; titlePageExist: boolean }>`
	--title: "${(p) => p.title}";

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
			if (!printableContent.template || !containerDivRef?.current) return;

			const template = document.createElement("style");
			template.textContent = printableContent.template;
			containerDivRef.current.appendChild(template);
		}, [printableContent.template]);

		const handleLastRender = useCallback(() => {
			if (!renderDivRef.current || !printDivRef.current || printableContent.items.length === 0) return;
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
										key={i + item.title}
										item={item}
										index={i}
										components={components}
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
				/>
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.itemPath === nextProps.itemPath && prevProps.catalogProps === nextProps.catalogProps;
	},
);

export default PrintPages;
