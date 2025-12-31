import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { LinkHoverTooltipManager } from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltipManager";
import { createContext, useContext, useEffect, useRef } from "react";

interface ArticleTooltipContext {
	setLink: (link: HTMLElement, resourcePath: string, hash?: string, href?: string) => void;
	removeLink: (resourcePath: string) => void;
}

export const ArticleTooltip = createContext<ArticleTooltipContext>({
	setLink: () => {},
	removeLink: () => {},
});

abstract class ArticleTooltipService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const tooltipManager = useRef<LinkHoverTooltipManager>(null);

		useEffect(() => {
			if (typeof document === "undefined") return;

			if (tooltipManager.current !== null) {
				tooltipManager.current.destroyAll();
			}

			tooltipManager.current = new LinkHoverTooltipManager(document.body, pageDataContext);

			return () => {
				if (tooltipManager.current !== null) {
					tooltipManager.current.destroyAll();
					tooltipManager.current = null;
				}
			};
		}, []);

		const setLinkHandler = (element: HTMLElement, resourcePath: string, hash?: string, href?: string) => {
			if (typeof document === "undefined") return;

			tooltipManager.current?.createTooltip({
				linkElement: element,
				resourcePath,
				hash,
				apiUrlCreator,
				href,
			});
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
