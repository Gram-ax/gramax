import DiagramType from "@core/components/Diagram/DiagramType";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import t from "@ext/localization/locale/translate";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import DiagramsMenuButton from "@ext/markdown/elements/diagrams/edit/components/DiagramsMenuButton";
import DrawioMenuButton from "@ext/markdown/elements/drawio/edit/components/DrawioMenuButton";
import OpenApiMenuButton from "@ext/markdown/elements/openApi/edit/components/OpenApiMenuButton";
import { useMediaQuery } from "@mui/material";
import type { Editor } from "@tiptap/core";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuTrigger, useHoverDropdown } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarDropdownMenuContent, ToolbarIcon, ToolbarTrigger } from "@ui-kit/Toolbar";
import { useCallback, useMemo } from "react";

interface DiagramsMenuGroupProps {
	editor?: Editor;
	fileName?: string;
}

const DiagramsMenuGroup = ({ editor, fileName }: DiagramsMenuGroupProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const diagramRendererUrl = PageDataContextService.value.conf.diagramsServiceUrl;
	const drawIo = ButtonStateService.useCurrentAction({ action: "drawio" });
	const diagrams = ButtonStateService.useCurrentAction({ action: "diagrams" });
	const openApi = ButtonStateService.useCurrentAction({ action: "openapi" });

	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();

	const syntax = useCatalogPropsStore((state) => state.data.syntax);
	const { isDrawioSupported, isMermaidSupported, isPlantUmlSupported, isOpenApiSupported } = useMemo(() => {
		const formatterSupportedElements = getFormatterType(syntax).supportedElements;

		return {
			isDrawioSupported: formatterSupportedElements.includes("drawio") && diagramRendererUrl,
			isMermaidSupported: formatterSupportedElements.includes("mermaid"),
			isPlantUmlSupported: formatterSupportedElements.includes("plant-uml") && diagramRendererUrl,
			isOpenApiSupported: formatterSupportedElements.includes("openApi"),
		};
	}, [syntax, diagramRendererUrl]);

	const onMouseLeave = useCallback(() => {
		handleMouseLeave();
		if (!isMobile) editor.commands.focus(undefined, { scrollIntoView: false });
	}, [editor, handleMouseLeave, isMobile]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile, setIsOpen],
	);

	const onInteractOutside = useCallback(() => {
		if (isMobile) return;
		setIsOpen(false);
	}, [isMobile, setIsOpen]);

	if (!isDrawioSupported && !isMermaidSupported && !isPlantUmlSupported && !isOpenApiSupported) {
		return null;
	}

	const isActive = drawIo.isActive || diagrams.isActive || openApi.isActive;
	const disabled = drawIo.disabled && diagrams.disabled && openApi.disabled;

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				className={cn(disabled && "pointer-events-none")}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				<DropdownMenu modal={false} onOpenChange={onOpenChange} open={isOpen}>
					<DropdownMenuTrigger asChild>
						<ToolbarTrigger
							data-open={isOpen ? "open" : "closed"}
							data-state={isActive ? "open" : "closed"}
							disabled={disabled}
						>
							<ToolbarIcon icon="diagrams" />
						</ToolbarTrigger>
					</DropdownMenuTrigger>
					<ToolbarDropdownMenuContent
						align="start"
						alignOffset={!isMobile ? -19 : -5}
						className={cn(!isMobile && "px-3 py-3 pb-2")}
						contentClassName="lg:shadow-hard-base"
						onInteractOutside={onInteractOutside}
						side="top"
						sideOffset={isMobile ? 10 : 0}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("diagrams")}
						</DropdownMenuLabel>
						{isDrawioSupported && <DrawioMenuButton editor={editor} fileName={fileName} />}
						{isMermaidSupported && (
							<DiagramsMenuButton diagramName={DiagramType.mermaid} editor={editor} fileName={fileName} />
						)}
						{isPlantUmlSupported && (
							<DiagramsMenuButton
								diagramName={DiagramType["plant-uml"]}
								editor={editor}
								fileName={fileName}
							/>
						)}
						{isOpenApiSupported && <OpenApiMenuButton editor={editor} />}
					</ToolbarDropdownMenuContent>
				</DropdownMenu>
			</div>
		</ComponentVariantProvider>
	);
};

export default DiagramsMenuGroup;
