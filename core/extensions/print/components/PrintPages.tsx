import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import { ArticlePrintPreview } from "@ext/print/components/ArticlePrintPreview";
import { useGetItems } from "@ext/print/components/useGetItems";
import { PdfPrintParams } from "@ext/print/types";
import paginateIntoPages from "@ext/print/utils/paginateIntoPages";
import { memo, useMemo, useRef } from "react";

type PrintPagesProps = {
	itemPath?: string;
	isCategory?: boolean;
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	params: PdfPrintParams;
	onDone?: VoidFunction;
};

const PrintPages = memo(
	({ itemPath, isCategory, catalogProps, apiUrlCreator, params, onDone }: PrintPagesProps) => {
		const { items } = useGetItems(catalogProps.name, apiUrlCreator, isCategory, itemPath, params.titleNumber);
		const components = useMemo(getComponents, []);

		const renderDivRef = useRef<HTMLDivElement>(null);
		const printDivRef = useRef<HTMLDivElement>(null);

		const startPaginateIntoPages = async () => {
			const newParams = { ...params };
			if (params.template) {
				const res = await FetchService.fetch(apiUrlCreator.getPdfTemplateUrl(params.template));
				if (res.ok) newParams.template = await res.text();
			}

			setTimeout(() => {
				paginateIntoPages(renderDivRef.current, printDivRef.current, newParams, items, onDone);
			}, 200);
		};

		return (
			<>
				<CatalogPropsService.Provider value={catalogProps}>
					<div className="render-body" ref={renderDivRef}>
						{items.map((item, i) => (
							<ArticlePrintPreview
								key={i + item.title}
								item={item}
								index={i}
								components={components}
								onRender={i === items.length - 1 ? startPaginateIntoPages : undefined}
							/>
						))}
					</div>
				</CatalogPropsService.Provider>
				<div className="print-body" ref={printDivRef} />
			</>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.itemPath === nextProps.itemPath && prevProps.catalogProps === nextProps.catalogProps;
	},
);

export default PrintPages;
