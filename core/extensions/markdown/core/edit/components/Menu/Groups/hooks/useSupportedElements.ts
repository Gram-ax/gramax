import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { useMemo } from "react";

const useSupportedElements = () => {
	const syntax = useCatalogPropsStore((state) => state?.data?.syntax);
	const diagramRendererUrl = PageDataContextService.value?.settings?.services?.["diagram-renderer"]?.endpoint;

	return useMemo(() => {
		const supportedElements = getFormatterType(syntax).supportedElements;
		return {
			isTabsSupported: supportedElements.includes("tabs"),
			isFragmentSupported: supportedElements.includes("fragment"),
			isHtmlSupported: supportedElements.includes("HTML"),
			isViewSupported: supportedElements.includes("view"),
			isCommentSupported: supportedElements.includes("comment"),
			isDrawioSupported: supportedElements.includes("drawio") && !!diagramRendererUrl,
			isMermaidSupported: supportedElements.includes("mermaid"),
			isPlantUmlSupported: supportedElements.includes("plant-uml") && !!diagramRendererUrl,
			isOpenApiSupported: supportedElements.includes("openApi"),
			isVideoSupported: supportedElements.includes("video"),
			isIconSupported: supportedElements.includes("icon"),
		};
	}, [syntax, diagramRendererUrl]);
};

export default useSupportedElements;
