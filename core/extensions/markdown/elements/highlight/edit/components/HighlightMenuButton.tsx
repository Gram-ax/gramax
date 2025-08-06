import { Editor } from "@tiptap/core";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import t from "@ext/localization/locale/translate";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import styled from "@emotion/styled";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import { useState } from "react";
import ButtonLayout from "@components/Layouts/ButtonLayout";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";

const HighlightButton = styled.div<{ color: HIGHLIGHT_COLOR_NAMES }>`
	padding: 6.75px 7.25px;

	> div {
		width: 1em;
		height: 1em;
		cursor: pointer;
		background-color: ${({ color }) => `var(--color-highlight-${color})`};
		border-radius: 4px;
	}
`;

const TooltipContent = styled.div`
	display: flex;
	border-radius: var(--radius-large);
	background: var(--color-tooltip-background);
	padding: 4px;
	gap: 0.5em;
`;

const StyledButton = styled(Button)`
	.fill-current {
		fill: var(--color-highlight-${({ color }) => color});
	}
`;

const HighlightMenuButton = ({ editor }: { editor: Editor }) => {
	const { isActive: active, disabled } = ButtonStateService.useCurrentAction({ mark: "highlight" });
	const [isOpen, setIsOpen] = useState(false);
	const activeColor = editor.getAttributes("highlight")?.color;
	const lastUsedColor = EditorService.getData("lastUsedHighlightColor");

	const isActive = active || activeColor;

	const onClickHandler = (color: HIGHLIGHT_COLOR_NAMES) => {
		if (color === HIGHLIGHT_COLOR_NAMES.DEFAULT) {
			editor.commands.unsetHighlight();
			return;
		}

		EditorService.setData("lastUsedHighlightColor", color);
		editor.commands.setHighlight({ color });
	};

	const onTriggerClick = () => {
		if (isActive) editor.commands.unsetHighlight();
		else editor.commands.setHighlight({ color: lastUsedColor ?? HIGHLIGHT_COLOR_NAMES.LEMON_YELLOW });
	};

	const isActiveColor = (name: HIGHLIGHT_COLOR_NAMES) => {
		if (name === HIGHLIGHT_COLOR_NAMES.DEFAULT && !activeColor) return true;
		return activeColor === name;
	};

	return (
		<Tooltip
			hideOnClick={false}
			hideInMobile={false}
			onShow={() => setIsOpen(true)}
			onHide={() => setIsOpen(false)}
			appendTo="parent"
			trigger="focus mouseenter"
			placement="top"
			distance={8}
			interactive
			arrow={false}
			customStyle
			disabled={disabled}
			content={
				<TooltipContent>
					<ButtonLayout>
						{isOpen && (
							<>
								{Object.values(HIGHLIGHT_COLOR_NAMES).map(
									(color, index) =>
										index > 0 && (
											<Tooltip key={color} content={t(`editor.highlight.colors.${color}`)}>
												<Button isActive={isActiveColor(color)}>
													<HighlightButton
														color={color}
														onClick={() => onClickHandler(color)}
														className={classNames("highlight-button", {
															active: isActiveColor(color),
														})}
													>
														<div />
													</HighlightButton>
												</Button>
											</Tooltip>
										),
								)}
							</>
						)}
					</ButtonLayout>
				</TooltipContent>
			}
		>
			<StyledButton
				disabled={disabled}
				isActive={isActive}
				onClick={onTriggerClick}
				icon="color-highlighter"
				color={lastUsedColor || HIGHLIGHT_COLOR_NAMES.LEMON_YELLOW}
			/>
		</Tooltip>
	);
};

export default HighlightMenuButton;
