import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import LinkHoverTooltip from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltip";
import { createContext, useContext, useRef } from "react";

const ArticleTooltip = createContext<(link: HTMLElement, resourcePath: string) => void>(undefined);

abstract class ArticleTooltipService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const isEdit = IsEditService.value;
		const catalogProps = CatalogPropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;

		if (isEdit || typeof document === "undefined") return children;

		const linkHoverTooltipRef = useRef<LinkHoverTooltip>(
			new LinkHoverTooltip(document.body, apiUrlCreator, pageDataContext, catalogProps),
		);

		const setLinkHandler = (element: HTMLElement, resourcePath: string) => {
			linkHoverTooltipRef.current.setResourcePath(resourcePath);
			linkHoverTooltipRef.current.setComponent(element);
		};

		return <ArticleTooltip.Provider value={setLinkHandler}>{children}</ArticleTooltip.Provider>;
	}

	static get value(): (link: HTMLElement, resourcePath: string) => void {
		return useContext(ArticleTooltip);
	}
}

export default ArticleTooltipService;
