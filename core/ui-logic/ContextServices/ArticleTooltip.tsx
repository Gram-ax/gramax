import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import LinkHoverTooltip from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltip";
import { createContext, useContext, useRef, useEffect } from "react";

const ArticleTooltip = createContext<(link: HTMLElement, resourcePath: string) => void>(undefined);

abstract class ArticleTooltipService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const isEdit = IsEditService.value;
		const catalogProps = CatalogPropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const linkHoverTooltipRef = useRef<LinkHoverTooltip>(null);

		useEffect(() => {
			if (typeof document === "undefined" || isEdit) return;

			if (linkHoverTooltipRef.current !== null) {
				linkHoverTooltipRef.current.unMount();
			}

			linkHoverTooltipRef.current = new LinkHoverTooltip(
				document.body,
				apiUrlCreator,
				pageDataContext,
				catalogProps,
			);

			return () => {
				if (linkHoverTooltipRef.current !== null) {
					linkHoverTooltipRef.current.unMount();
					linkHoverTooltipRef.current = null;
				}
			};
		}, [catalogProps]);

		const setLinkHandler = (element: HTMLElement, resourcePath: string) => {
			if (typeof document === "undefined") return;

			linkHoverTooltipRef.current.setResourcePath(resourcePath);
			linkHoverTooltipRef.current.setComponent(element);
		};

		return <ArticleTooltip.Provider value={isEdit ? () => {} : setLinkHandler}>{children}</ArticleTooltip.Provider>;
	}

	static get value(): (link: HTMLElement, resourcePath: string) => void {
		return useContext(ArticleTooltip);
	}
}

export default ArticleTooltipService;
