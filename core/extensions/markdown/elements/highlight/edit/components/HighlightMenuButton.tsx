import { Editor } from "@tiptap/core";
import t from "@ext/localization/locale/translate";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import styled from "@emotion/styled";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { ColorTile } from "@ui-kit/ColorTile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { memo, MouseEvent, useCallback, useState } from "react";
import { useHoverDropdown } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import useWatch from "@core-ui/hooks/useWatch";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { cn } from "@core-ui/utils/cn";

const HighlightButton = styled(ColorTile)<{ color: HIGHLIGHT_COLOR_NAMES }>`
	background-color: ${({ color }) => `var(--color-highlight-${color})`};
`;

const StyledButton = styled(ToolbarToggleButton)`
	.fill-current {
		fill: var(--color-highlight-${({ color }) => color});
	}
`;

const HighlightMenuButton = ({ editor }: { editor: Editor }) => {
	const { isActive: active, disabled, attrs } = ButtonStateService.useCurrentAction({ mark: "highlight" });
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const [activeColor, setActiveColor] = useState<HIGHLIGHT_COLOR_NAMES>(editor.getAttributes("highlight")?.color);
	const lastUsedColor = EditorService.getData("lastUsedHighlightColor");

	useWatch(() => {
		setActiveColor(attrs?.color ? (attrs.color as HIGHLIGHT_COLOR_NAMES) : HIGHLIGHT_COLOR_NAMES.DEFAULT);
	}, [attrs?.color]);

	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();

	const isActive = active && activeColor !== HIGHLIGHT_COLOR_NAMES.DEFAULT;

	const onClickHandler = useCallback(
		(event: MouseEvent<HTMLDivElement>, color: HIGHLIGHT_COLOR_NAMES) => {
			event.preventDefault();
			if (color === HIGHLIGHT_COLOR_NAMES.DEFAULT) {
				editor.commands.unsetHighlight();
				setActiveColor(HIGHLIGHT_COLOR_NAMES.DEFAULT);
				return;
			}

			EditorService.setData("lastUsedHighlightColor", color);
			editor.commands.setHighlight({ color });
			setActiveColor(color);
		},
		[editor],
	);

	const onTriggerClick = useCallback(() => {
		if (isMobile) {
			if (disabled) return;
			setIsOpen(true);
			return;
		}

		if (isActive) {
			editor.commands.unsetHighlight();
			setActiveColor(HIGHLIGHT_COLOR_NAMES.DEFAULT);
			return;
		}

		const color = lastUsedColor ?? HIGHLIGHT_COLOR_NAMES.LEMON_YELLOW;
		editor.commands.setHighlight({ color });
		setActiveColor(color);
	}, [isActive, disabled, editor, lastUsedColor, isMobile]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile, setIsOpen],
	);

	const onInteractOutside = useCallback(() => {
		if (!isMobile) return;
		setIsOpen(false);
	}, [isMobile, setIsOpen]);

	const isActiveColor = useCallback(
		(name: HIGHLIGHT_COLOR_NAMES) => {
			if (name === HIGHLIGHT_COLOR_NAMES.DEFAULT && !activeColor) return true;
			return activeColor === name;
		},
		[activeColor],
	);

	const onMouseLeave = useCallback(() => {
		handleMouseLeave();
		editor.commands.focus(undefined, { scrollIntoView: false });
	}, [editor, handleMouseLeave]);

	const onAutoCloseFocus = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				onMouseEnter={handleMouseEnter}
				onMouseLeave={onMouseLeave}
				className={cn(disabled && "pointer-events-none")}
			>
				<Popover open={isOpen} onOpenChange={onOpenChange}>
					<PopoverTrigger asChild>
						<StyledButton
							disabled={disabled}
							active={isActive}
							data-open={isOpen ? "open" : "closed"}
							color={lastUsedColor || HIGHLIGHT_COLOR_NAMES.LEMON_YELLOW}
							className="text-inverse-primary-fg"
							onClick={onTriggerClick}
						>
							<ToolbarIcon icon="color-highlighter" />
						</StyledButton>
					</PopoverTrigger>
					<PopoverContent
						side="top"
						className="bg-transparent px-3 py-3 pb-2 border-none w-auto"
						alignOffset={!isMobile ? -18 : -5}
						sideOffset={0}
						style={{ boxShadow: "none" }}
						onCloseAutoFocus={onAutoCloseFocus}
						onInteractOutside={onInteractOutside}
					>
						<div className="flex items-center p-1 gap-1 w-auto bg-inverse-primary-bg rounded-lg lg:shadow-hard-base overflow-hidden">
							{Object.values(HIGHLIGHT_COLOR_NAMES).map((color) => (
								<Tooltip key={color}>
									<TooltipTrigger asChild>
										<HighlightButton
											color={color}
											selected={isActiveColor(color)}
											onClick={(event) => onClickHandler(event, color)}
										/>
									</TooltipTrigger>
									<TooltipContent>{t(`editor.highlight.colors.${color}`)}</TooltipContent>
								</Tooltip>
							))}
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</ComponentVariantProvider>
	);
};

export default memo(HighlightMenuButton);
