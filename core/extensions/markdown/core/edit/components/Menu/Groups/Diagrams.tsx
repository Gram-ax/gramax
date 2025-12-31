import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import DiagramType from "@core/components/Diagram/DiagramType";
import { Editor } from "@tiptap/core";
import DiagramsMenuButton from "@ext/markdown/elements/diagrams/edit/components/DiagramsMenuButton";
import DrawioMenuButton from "@ext/markdown/elements/drawio/edit/components/DrawioMenuButton";
import OpenApiMenuButton from "@ext/markdown/elements/openApi/edit/components/OpenApiMenuButton";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useCallback, useMemo } from "react";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuTrigger, useHoverDropdown } from "@ui-kit/Dropdown";
import { ToolbarDropdownMenuContent, ToolbarIcon, ToolbarTrigger } from "@ui-kit/Toolbar";
import t from "@ext/localization/locale/translate";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { cn } from "@core-ui/utils/cn";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";

interface DiagramsMenuGroupProps {
	editor?: Editor;
	fileName?: string;
}

const DiagramsMenuGroup = ({ editor, fileName }: DiagramsMenuGroupProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const drawIo = ButtonStateService.useCurrentAction({ action: "drawio" });
	const diagrams = ButtonStateService.useCurrentAction({ action: "diagrams" });
	const openApi = ButtonStateService.useCurrentAction({ action: "openapi" });

	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();

	const syntax = useCatalogPropsStore((state) => state.data.syntax);
	const { isDrawioSupported, isMermaidSupported, isPlantUmlSupported, isOpenApiSupported } = useMemo(() => {
		const formatterSupportedElements = getFormatterType(syntax).supportedElements;

		return {
			isDrawioSupported: formatterSupportedElements.includes("drawio"),
			isMermaidSupported: formatterSupportedElements.includes("mermaid"),
			isPlantUmlSupported: formatterSupportedElements.includes("plant-uml"),
			isOpenApiSupported: formatterSupportedElements.includes("openApi"),
		};
	}, [syntax]);

	const onMouseLeave = useCallback(() => {
		handleMouseLeave();
		if (!isMobile) editor.commands.focus(undefined, { scrollIntoView: false });
	}, [editor, handleMouseLeave, isMobile]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile],
	);

	const onInteractOutside = useCallback(() => {
		if (isMobile) return;
		setIsOpen(false);
	}, [isMobile]);

	if (!isDrawioSupported && !isMermaidSupported && !isPlantUmlSupported && !isOpenApiSupported) {
		return null;
	}

	const isActive = drawIo.isActive || diagrams.isActive || openApi.isActive;
	const disabled = drawIo.disabled && diagrams.disabled && openApi.disabled;

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				onMouseEnter={handleMouseEnter}
				onMouseLeave={onMouseLeave}
				className={cn(disabled && "pointer-events-none")}
			>
				<DropdownMenu open={isOpen} onOpenChange={onOpenChange} modal={false}>
					<DropdownMenuTrigger asChild>
						<ToolbarTrigger
							data-state={isActive ? "open" : "closed"}
							data-open={isOpen ? "open" : "closed"}
							disabled={disabled}
						>
							<ToolbarIcon icon="diagrams" />
						</ToolbarTrigger>
					</DropdownMenuTrigger>
					<ToolbarDropdownMenuContent
						align="start"
						side="top"
						contentClassName="lg:shadow-hard-base"
						className={cn(!isMobile && "px-3 py-3 pb-2")}
						alignOffset={!isMobile ? -19 : -5}
						sideOffset={isMobile ? 10 : 0}
						onInteractOutside={onInteractOutside}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("diagrams")}
						</DropdownMenuLabel>
						{isDrawioSupported && <DrawioMenuButton editor={editor} fileName={fileName} />}
						{isMermaidSupported && (
							<DiagramsMenuButton
								editor={editor}
								diagramName={DiagramType["mermaid"]}
								fileName={fileName}
							/>
						)}
						{isPlantUmlSupported && (
							<DiagramsMenuButton
								editor={editor}
								diagramName={DiagramType["plant-uml"]}
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
