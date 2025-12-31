import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { FileMenuButtonDropdown } from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import ImageMenuButton from "@ext/markdown/elements/image/edit/components/ImageMenuButton";
import VideoMenuButton from "@ext/markdown/elements/video/edit/components/VideoMenuButton";
import { Editor } from "@tiptap/core";
import IconMenuButton from "@ext/markdown/elements/icon/edit/components/IconMenuButton";
import { useCallback, useMemo, useRef } from "react";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuTrigger, useHoverDropdown } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarDropdownMenuContent, ToolbarIcon, ToolbarTrigger } from "@ui-kit/Toolbar";
import t from "@ext/localization/locale/translate";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { cn } from "@core-ui/utils/cn";

interface FilesMenuGroupProps {
	editor?: Editor;
	fileName?: string;
	isSmallEditor?: boolean;
}

const FilesMenuGroup = ({ editor, fileName, isSmallEditor }: FilesMenuGroupProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const file = ButtonStateService.useCurrentAction({ mark: "file" });
	const image = ButtonStateService.useCurrentAction({ action: "image" });
	const video = ButtonStateService.useCurrentAction({ action: "video" });
	const icon = ButtonStateService.useCurrentAction({ action: "icon" });

	const isFileProcessing = useRef<boolean>(false);

	const preventClose = useCallback(() => {
		return isFileProcessing.current;
	}, []);

	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown(undefined, { preventClose });
	const syntax = useCatalogPropsStore((state) => state.data.syntax);

	const { isVideoSupported, isIconSupported } = useMemo(() => {
		const supportedElements = getFormatterType(syntax).supportedElements;
		return {
			isVideoSupported: supportedElements.includes("video"),
			isIconSupported: supportedElements.includes("icon"),
		};
	}, [syntax]);

	const onMouseLeave = useCallback(() => {
		if (isFileProcessing.current || isMobile) return;
		handleMouseLeave();
		editor.commands.focus(undefined, { scrollIntoView: false });
	}, [editor, handleMouseLeave, isMobile]);

	const onFileProcessingEnd = useCallback(() => {
		isFileProcessing.current = false;
		if (isMobile) return;
		handleMouseLeave();
	}, [handleMouseLeave, isMobile]);

	const onFileProcessingStart = useCallback(() => {
		isFileProcessing.current = true;
	}, []);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open && !isMobile) editor.commands.focus(undefined, { scrollIntoView: false });
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile, editor],
	);

	const onInteractOutside = useCallback(() => {
		if (isMobile) return;
		setIsOpen(false);
	}, [isMobile]);

	const onFocusOutside = useCallback(() => {
		if (isFileProcessing.current) return;
		handleMouseLeave();
	}, [handleMouseLeave]);

	const disabled = file.disabled && image.disabled && video.disabled && icon.disabled;
	const isActive = file.isActive || image.isActive || video.isActive || icon.isActive;

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				tabIndex={-1}
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
							<ToolbarIcon icon="file-video" />
						</ToolbarTrigger>
					</DropdownMenuTrigger>
					<ToolbarDropdownMenuContent
						contentClassName="lg:shadow-hard-base"
						side="top"
						align="start"
						className={cn(!isMobile && "px-3 py-3 pb-2")}
						alignOffset={!isMobile ? -19 : -5}
						sideOffset={isMobile ? 10 : 0}
						onInteractOutside={onInteractOutside}
						onFocusOutside={onFocusOutside}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("editor.attachments")}
						</DropdownMenuLabel>
						{!isSmallEditor && (
							<FileMenuButtonDropdown
								editor={editor}
								onSave={onFileProcessingEnd}
								onStart={onFileProcessingStart}
							/>
						)}
						<ImageMenuButton
							editor={editor}
							fileName={fileName}
							onSave={onFileProcessingEnd}
							onStart={onFileProcessingStart}
						/>
						{isVideoSupported && <VideoMenuButton editor={editor} />}
						{isIconSupported && <IconMenuButton editor={editor} />}
					</ToolbarDropdownMenuContent>
				</DropdownMenu>
			</div>
		</ComponentVariantProvider>
	);
};

export default FilesMenuGroup;
