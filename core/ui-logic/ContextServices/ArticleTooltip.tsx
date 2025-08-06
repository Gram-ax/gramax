import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { LinkHoverTooltipManager } from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltipManager";
import { createContext, useContext, useRef, useEffect } from "react";

interface ArticleTooltipContext {
	setLink: (link: HTMLElement, resourcePath: string, hash?: string) => void;
	removeLink: (resourcePath: string) => void;
}

export const ArticleTooltip = createContext<ArticleTooltipContext>({
	setLink: () => {},
	removeLink: () => {},
});

abstract class ArticleTooltipService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const catalogProps = CatalogPropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const tooltipManager = useRef<LinkHoverTooltipManager>(null);

		useEffect(() => {
			if (typeof document === "undefined") return;

			if (tooltipManager.current !== null) {
				tooltipManager.current.destroyAll();
			}

			tooltipManager.current = new LinkHoverTooltipManager(
				document.body,
				apiUrlCreator,
				pageDataContext,
				catalogProps,
			);

			return () => {
				if (tooltipManager.current !== null) {
					tooltipManager.current.destroyAll();
					tooltipManager.current = null;
				}
			};
		}, [catalogProps]);

		const setLinkHandler = (element: HTMLElement, resourcePath: string, hash?: string) => {
			if (typeof document === "undefined") return;

			tooltipManager.current?.createTooltip({ linkElement: element, resourcePath, hash });
		};

		const removeLinkHandler = (resourcePath: string) => {
			if (typeof document === "undefined") return;
			const tooltip = tooltipManager.current?.getTooltip(resourcePath);
			if (tooltip) tooltipManager.current?.removeTooltip(tooltip);
		};

		return (
			<ArticleTooltip.Provider value={{ setLink: setLinkHandler, removeLink: removeLinkHandler }}>
				{children}
			</ArticleTooltip.Provider>
		);
	}

	static get value(): ArticleTooltipContext {
		return useContext(ArticleTooltip);
	}
}

export default ArticleTooltipService;
