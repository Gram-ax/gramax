import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { getEditorStore, setEditorStore } from "@core-ui/stores/EditorStore";
import { cssMedia } from "@core-ui/utils/cssUtils";
import t from "@ext/localization/locale/translate";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import type { Editor } from "@tiptap/core";
import { ColorTile } from "@ui-kit/ColorTile";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarToggleButton, ToolbarTriggerChevron } from "@ui-kit/Toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MouseEvent, memo, useCallback, useRef } from "react";
import { tv } from "tailwind-variants";

const colorTileStyles = tv({
	variants: {
		color: {
			yellow: "bg-[var(--color-highlight-yellow)]",
			green: "bg-[var(--color-highlight-green)]",
			purple: "bg-[var(--color-highlight-purple)]",
			blue: "bg-[var(--color-highlight-blue)]",
			orange: "bg-[var(--color-highlight-orange)]",
			red: "bg-[var(--color-highlight-red)]",
		},
	},
});

const markerStyles = tv({
	base: "text-inverse-primary-fg",
	variants: {
		color: {
			yellow: "[&>svg>path:last-child]:fill-[var(--color-highlight-yellow)]",
			green: "[&>svg>path:last-child]:fill-[var(--color-highlight-green)]",
			purple: "[&>svg>path:last-child]:fill-[var(--color-highlight-purple)]",
			blue: "[&>svg>path:last-child]:fill-[var(--color-highlight-blue)]",
			orange: "[&>svg>path:last-child]:fill-[var(--color-highlight-orange)]",
			red: "[&>svg>path:last-child]:fill-[var(--color-highlight-red)]",
		},
	},
});

const HighlightMenuButton = ({ editor }: { editor: Editor }) => {
	const { isActive: active, disabled, attrs } = ButtonStateService.useCurrentAction({ mark: "highlight" });
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const lastUsedColor = getEditorStore().lastUsedHighlightColor ?? HIGHLIGHT_COLOR_NAMES.YELLOW;
	const portalContainerRef = useRef<HTMLDivElement>(null);
	const isActive = active;

	const onClickHandler = useCallback(
		(event: MouseEvent<HTMLDivElement>, color: HIGHLIGHT_COLOR_NAMES) => {
			event.preventDefault();
			setEditorStore({ lastUsedHighlightColor: color });
			editor.commands.setHighlight({ color });
		},
		[editor],
	);

	const onTriggerClick = useCallback(() => {
		if (isActive) {
			editor.commands.unsetHighlight();
			return;
		}

		const color = lastUsedColor ?? HIGHLIGHT_COLOR_NAMES.YELLOW;
		editor.commands.setHighlight({ color });
	}, [isActive, editor, lastUsedColor]);

	const onAutoCloseFocus = useCallback(
		(event: Event) => {
			event.preventDefault();
			editor.commands.focus();
		},
		[editor],
	);

	return (
		<ComponentVariantProvider variant="inverse">
			<ToolbarToggleButton
				active={isActive}
				className={markerStyles({ color: attrs?.color || lastUsedColor })}
				disabled={disabled}
				onClick={onTriggerClick}
			>
				<ToolbarIcon icon="color-highlighter" />
			</ToolbarToggleButton>
			<Popover>
				<PopoverTrigger asChild>
					<ToolbarTriggerChevron disabled={disabled} focusable sub />
				</PopoverTrigger>
				<PopoverContent
					alignOffset={!isMobile ? -18 : -5}
					className="bg-transparent px-3 py-3 pb-2 border-none w-auto rounded-xl"
					onCloseAutoFocus={onAutoCloseFocus}
					portalContainer={portalContainerRef.current}
					side="top"
					sideOffset={0}
					style={{ boxShadow: "none" }}
				>
					<div className="flex items-center p-1 gap-1 w-auto bg-inverse-primary-bg rounded-lg lg:shadow-hard-base overflow-hidden">
						{Object.values(HIGHLIGHT_COLOR_NAMES).map((color) => (
							<Tooltip key={color}>
								<TooltipTrigger asChild>
									<div className="[&>div:last-of-type]:border-inverse-secondary-fg">
										<ColorTile
											className={colorTileStyles({ color })}
											onClick={(event) => onClickHandler(event, color)}
											selected={isActive && attrs?.color === color}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent>{t(`editor.highlight.colors.${color}`)}</TooltipContent>
							</Tooltip>
						))}
					</div>
				</PopoverContent>
			</Popover>
		</ComponentVariantProvider>
	);
};

export default memo(HighlightMenuButton);
