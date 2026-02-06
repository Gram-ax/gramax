import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import t from "@ext/localization/locale/translate";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import HTMLMenuButton from "@ext/markdown/elements/html/edit/components/HTMLMenuButton";
import QuestionMenuButton from "@ext/markdown/elements/question/edit/components/QuestionMenuButton";
import SnippetsButton from "@ext/markdown/elements/snippet/edit/components/SnippetsButton";
import TabsMenuButton from "@ext/markdown/elements/tabs/edit/components/TabsMenuButton";
import ViewMenuButton from "@ext/markdown/elements/view/edit/components/ViewMenuButton";
import { useMediaQuery } from "@mui/material";
import { Editor } from "@tiptap/core";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuTrigger, useHoverDropdown } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarDropdownMenuContent, ToolbarIcon, ToolbarTrigger } from "@ui-kit/Toolbar";
import { useCallback, useMemo } from "react";

interface SemiBlocksProps {
	editor?: Editor;
	includeResources?: boolean;
	isSmallEditor?: boolean;
}

const SemiBlocks = ({ editor, includeResources, isSmallEditor }: SemiBlocksProps) => {
	const tabs = ButtonStateService.useCurrentAction({ action: "tabs" });
	const view = ButtonStateService.useCurrentAction({ action: "view" });
	const question = ButtonStateService.useCurrentAction({ action: "question" });
	const html = ButtonStateService.useCurrentAction({ action: "html" });
	const snippet = ButtonStateService.useCurrentAction({ action: "snippet" });
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();

	const syntax = useCatalogPropsStore((state) => state.data.syntax);
	const { isTabsSupported, isSnippetSupported, isHtmlSupported, isViewSupported } = useMemo(() => {
		const supportedElements = getFormatterType(syntax).supportedElements;

		const isTabsSupported = supportedElements.includes("tabs");
		const isSnippetSupported = supportedElements.includes("snippet");
		const isHtmlSupported = supportedElements.includes("HTML");
		const isViewSupported = supportedElements.includes("view");

		return { isTabsSupported, isSnippetSupported, isHtmlSupported, isViewSupported };
	}, [syntax]);

	const onMouseLeave = useCallback(() => {
		handleMouseLeave();
		if (!isMobile) editor.commands.focus(undefined, { scrollIntoView: false });
	}, [editor, handleMouseLeave, isMobile]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open && !isMobile) editor.commands.focus(undefined, { scrollIntoView: false });
		},
		[editor, isMobile],
	);

	const onInteractOutside = useCallback(() => {
		if (isMobile) return;
		setIsOpen(false);
	}, [isMobile]);

	const onFocusOutside = useCallback(() => {
		if (isMobile) return;
		handleMouseLeave();
	}, [handleMouseLeave, isMobile]);

	if (!isTabsSupported && !isSnippetSupported && !isHtmlSupported && !isViewSupported) {
		return null;
	}

	const isActive = tabs.isActive || snippet.isActive || view.isActive || question.isActive || html.isActive;
	const disabled = tabs.disabled && snippet.disabled && view.disabled && question.disabled && html.disabled;

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				className={cn(disabled && "pointer-events-none")}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={onMouseLeave}
				tabIndex={-1}
			>
				<DropdownMenu modal={false} onOpenChange={onOpenChange} open={isOpen}>
					<DropdownMenuTrigger asChild>
						<ToolbarTrigger
							data-open={isOpen ? "open" : "closed"}
							data-state={isActive ? "open" : "closed"}
							disabled={disabled}
						>
							<ToolbarIcon icon="pencil-ruler" />
						</ToolbarTrigger>
					</DropdownMenuTrigger>
					<ToolbarDropdownMenuContent
						align="start"
						alignOffset={!isMobile ? -19 : -5}
						className={cn(!isMobile && "px-3 py-3 pb-2")}
						contentClassName={cn(!isOpen && "pointer-events-none", "lg:shadow-hard-base")}
						onFocusOutside={onFocusOutside}
						onInteractOutside={onInteractOutside}
						side="top"
						sideOffset={isMobile ? 10 : 0}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("editor.tools")}
						</DropdownMenuLabel>
						<QuestionMenuButton editor={editor} />
						{isTabsSupported && <TabsMenuButton editor={editor} />}
						{!isSmallEditor && isSnippetSupported && includeResources && <SnippetsButton editor={editor} />}
						{isHtmlSupported && <HTMLMenuButton editor={editor} />}
						{!isSmallEditor && isViewSupported && <ViewMenuButton editor={editor} />}
					</ToolbarDropdownMenuContent>
				</DropdownMenu>
			</div>
		</ComponentVariantProvider>
	);
};

export default SemiBlocks;
