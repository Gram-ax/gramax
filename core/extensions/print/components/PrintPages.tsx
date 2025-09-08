import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import { ArticlePrintPreview } from "@ext/print/components/ArticlePrintPreview";
import { useGetItems } from "@ext/print/components/useGetItems";
import paginateIntoPages from "@ext/print/utils/paginateIntoPages";
import { memo, useMemo, useRef } from "react";
import { PrintMode } from "../types";

type PrintPagesProps = {
	itemPath?: string;
	isCategory?: boolean;
	printMode: PrintMode;
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	onDone?: VoidFunction;
};

const PrintPages = memo(
	({ itemPath, isCategory, catalogProps, apiUrlCreator, onDone }: PrintPagesProps) => {
		const { items } = useGetItems(catalogProps.name, apiUrlCreator, isCategory, itemPath);
		const components = useMemo(getComponents, []);

		const renderDivRef = useRef<HTMLDivElement>(null);
		const printDivRef = useRef<HTMLDivElement>(null);

		const startPaginateIntoPages = () => {
			setTimeout(() => {
				paginateIntoPages(renderDivRef.current, printDivRef.current, onDone);
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
