import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { LinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenu";
import { useLinkMenuState } from "@ext/markdown/elements/link/edit/hooks/useLinkMenuState";
import { useMediaQuery } from "@mui/material";
import { Editor } from "@tiptap/core";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { useCallback, useEffect, useState } from "react";

interface LinkMenuMobilePopoverProps {
	editor: Editor;
	toolbarSelector?: string;
}

const Container = styled.div`
	pointer-events: all;
	width: calc(100vw - 0.25rem);
	padding-left: 0.25rem;

	[data-radix-scroll-area-viewport] {
		overflow: hidden !important;
	}

	[data-radix-scroll-area-viewport] > div {
		display: flex !important;
		min-width: unset !important;
		max-width: 100% !important;
		width: 100% !important;
	}
`;

export const LinkMenuMobilePopover = (props: LinkMenuMobilePopoverProps) => {
	const { editor, toolbarSelector = "[role='article-toolbar']" } = props;
	const { mark, isOpen, setIsOpen, updateMarkState, onUpdate, handleDelete } = useLinkMenuState(editor);
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const [options, setOptions] = useState<{ bottom: number }>({ bottom: 0 });

	useEffect(() => {
		if (!editor || !isMobile) return;

		const onSelectionUpdate = () => {
			const result = updateMarkState();
			setIsOpen(result.shouldShow);
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor, isMobile, updateMarkState, setIsOpen]);

	useEffect(() => {
		if (!isOpen || !isMobile) return;

		const toolbar: HTMLElement = document.querySelector(toolbarSelector);
		if (!toolbar) return;

		const handleResize = () => {
			const toolbarRect = toolbar.getBoundingClientRect();

			setOptions({ bottom: toolbarRect.height });
		};

		handleResize();
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(toolbar);

		return () => {
			resizeObserver.disconnect();
		};
	}, [isOpen, isMobile, toolbarSelector]);

	const onDelete = useCallback(() => {
		handleDelete();
		setIsOpen(false);
	}, [setIsOpen, handleDelete]);

	if (!isOpen || !isMobile) return null;

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				style={{
					position: "fixed",
					bottom: options.bottom || 56,
					left: 0,
					right: 0,
					zIndex: 50,
					pointerEvents: "none",
					marginBottom: "0.25rem",
				}}
			>
				<Container className={cn("bg-transparent border-none lg:shadow-hard-base")}>
					<LinkMenu mark={mark} onDelete={onDelete} onUpdate={onUpdate} />
				</Container>
			</div>
		</ComponentVariantProvider>
	);
};
