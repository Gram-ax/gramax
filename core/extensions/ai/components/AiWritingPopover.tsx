import isMobileService from "@core-ui/ContextServices/isMobileService";
import { cn } from "@core-ui/utils/cn";
import { AiWritingPanel } from "@ext/ai/components/AiWritingPanel";
import { AnimatedPopoverContent } from "@ext/ai/components/Helpers/AnimatedPopoverContent";
import type { Editor } from "@tiptap/core";
import { Popover, PopoverTrigger } from "@ui-kit/Popover";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { type Dispatch, memo, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";

interface AiWritingPopoverProps {
	editor: Editor;

	triggerTooltipText: string;
	triggerIcon: string;

	contentPlaceholder: string;

	disabled?: boolean;

	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;

	toolbarSelector?: string;

	onSubmit: (command: string) => void;
}

const AiWritingPopover = (props: AiWritingPopoverProps) => {
	const {
		editor,
		triggerTooltipText,
		triggerIcon,
		contentPlaceholder,
		disabled,
		onSubmit: onSubmitProps,
		isOpen,
		setIsOpen,
		toolbarSelector,
	} = props;

	const [toolbarElement, setToolbarElement] = useState<HTMLElement>(null);
	const [options, setOptions] = useState<{ width: number; offset: number }>({ width: 0, offset: 0 });
	const isMobile = isMobileService.value;

	const triggerRef = useRef<HTMLButtonElement>(null);

	const onSubmit = useCallback(
		(command: string) => {
			if (!command?.length) return;
			onSubmitProps(command);
		},
		[onSubmitProps],
	);

	useEffect(() => {
		if (!isOpen) return;

		const toolbar: HTMLElement = document.querySelector(toolbarSelector);
		if (!toolbar) return;

		setToolbarElement(toolbar);

		const handleResize = () => {
			const toolbarRect = toolbar.getBoundingClientRect();
			const triggerRect = triggerRef.current.getBoundingClientRect();

			const leftOffset = toolbarRect.left - triggerRect.left;

			setOptions((prev) => ({
				...prev,
				offset: leftOffset,
				width: toolbarRect.width,
			}));
		};

		handleResize();
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(toolbar);

		return () => {
			resizeObserver.disconnect();
		};
	}, [isOpen, toolbarSelector]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);

			if (!open) editor.commands.focus();
		},
		[editor, setIsOpen],
	);

	const closeHandler = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	return (
		<ComponentVariantProvider variant="inverse">
			<Popover onOpenChange={onOpenChange} open={!disabled && isOpen}>
				<PopoverTrigger asChild>
					<div className={cn(disabled && "pointer-events-none")}>
						<ToolbarToggleButton
							active={isOpen}
							disabled={disabled}
							focusable
							ref={triggerRef}
							tooltipText={triggerTooltipText}
						>
							<ToolbarIcon icon={triggerIcon} />
						</ToolbarToggleButton>
					</div>
				</PopoverTrigger>
				<AnimatedPopoverContent
					align="start"
					alignOffset={options.offset}
					className={cn("p-0 bg-transparent border-none lg:shadow-hard-base", isMobile && "px-0.5")}
					portalContainer={toolbarElement}
					side="top"
					sideOffset={8}
					style={{ width: options.width, pointerEvents: "all" }}
				>
					<AiWritingPanel
						closeHandler={closeHandler}
						onSubmit={onSubmit}
						placeholder={contentPlaceholder}
						setOpen={setIsOpen}
					/>
				</AnimatedPopoverContent>
			</Popover>
		</ComponentVariantProvider>
	);
};

export default memo(AiWritingPopover);
