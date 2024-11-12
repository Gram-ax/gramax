import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import LinkHoverTooltip from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltip";
import { createContext, useContext, useRef, useEffect } from "react";

export const ArticleTooltip = createContext<(link: HTMLElement, resourcePath: string) => void>(() => {});

abstract class ArticleTooltipService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const catalogProps = CatalogPropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const linkHoverTooltipRef = useRef<LinkHoverTooltip>(null);

		useEffect(() => {
			if (typeof document === "undefined") return;

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

		return <ArticleTooltip.Provider value={setLinkHandler}>{children}</ArticleTooltip.Provider>;
	}

	static get value(): (link: HTMLElement, resourcePath: string) => void {
		return useContext(ArticleTooltip);
	}
}

export default ArticleTooltipService;
