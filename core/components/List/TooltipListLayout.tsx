import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ListLayout, { ListLayoutElement, ListLayoutProps } from "@components/List/ListLayout";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import styled from "@emotion/styled";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { useRef, useState } from "react";

const StyledDiv = styled.div`
	padding: 0 5.5px;
	width: 300px;
`;

interface TooltipListLayoutProps extends ListLayoutProps {
	tooltipText: string;
	buttonIcon: string;
	className?: string;
	action?: NodeType;
	onShow?: () => void;
}

const TooltipListLayout = (props: TooltipListLayoutProps) => {
	const { className, buttonIcon, onShow, action, tooltipText, placeholder = tooltipText, ...otherProps } = props;
	const state = ButtonStateService.useCurrentAction({ action });

	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);
	const childRef = useRef<ListLayoutElement>(null);

	const handleButtonClick = () => {
		childRef.current?.searchRef.inputRef.focus();
	};

	return (
		<Tooltip
			appendTo={"parent"}
			arrow={false}
			content={
				!state.disabled && isOpen ? (
					<ModalLayoutDark ref={containerRef}>
						<ButtonsLayout>
							<StyledDiv>
								<ListLayout
									appendTo={"parent"}
									containerRef={containerRef}
									disabledOutsideClick
									isCode={false}
									itemsClassName={className}
									openByDefault
									place="top"
									placeholder={placeholder}
									ref={childRef}
									{...otherProps}
								/>
							</StyledDiv>
						</ButtonsLayout>
					</ModalLayoutDark>
				) : (
					<></>
				)
			}
			customStyle
			distance={8}
			interactive
			onHide={() => setIsOpen(false)}
			onShow={() => {
				setIsOpen(true);
				onShow?.();
			}}
		>
			<div data-qa={`qa-${action}s`}>
				<Button
					icon={buttonIcon}
					nodeValues={{ action }}
					onClick={handleButtonClick}
					tooltipText={state.disabled && tooltipText}
				/>
			</div>
		</Tooltip>
	);
};

export default styled(TooltipListLayout)`
	left: 0;
	margin-top: 4px;
	min-width: 238px;
	border-radius: var(--radius-large);
	background: var(--color-tooltip-background);

	.item {
		color: var(--color-article-bg);
	}

	.item,
	.breadcrumb {
		.link {
			line-height: 1.5em;
		}
	}

	.item.active {
		background: var(--color-edit-menu-button-active-bg);
	}
`;
