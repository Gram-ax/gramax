import Button from "@ext/markdown/core/edit/components/Menu/Button";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import { useRef, useState } from "react";
import ListLayout, { ListLayoutElement, ListLayoutProps } from "@components/List/ListLayout";
import styled from "@emotion/styled";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";

const StyledDiv = styled.div`
	padding: 0 5.5px;
	width: 300px;
`;

interface TooltipListLayoutProps extends ListLayoutProps {
	className?: string;
	action: NodeType;
	tooltipText: string;
	buttonIcon: string;
	onShow: () => void;
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
			interactive
			distance={8}
			customStyle
			onShow={() => {
				setIsOpen(true);
				onShow();
			}}
			onHide={() => setIsOpen(false)}
			content={
				!state.disabled && isOpen ? (
					<ModalLayoutDark ref={containerRef}>
						<ButtonsLayout>
							<StyledDiv>
								<ListLayout
									ref={childRef}
									appendTo={"parent"}
									openByDefault
									isCode={false}
									place="top"
									itemsClassName={className}
									placeholder={placeholder}
									containerRef={containerRef}
									disabledOutsideClick
									{...otherProps}
								/>
							</StyledDiv>
						</ButtonsLayout>
					</ModalLayoutDark>
				) : (
					<></>
				)
			}
		>
			<div data-qa={`qa-${action}s`}>
				<Button
					icon={buttonIcon}
					nodeValues={{ action }}
					tooltipText={state.disabled && tooltipText}
					onClick={handleButtonClick}
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
