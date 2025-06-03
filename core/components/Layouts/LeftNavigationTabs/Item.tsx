import AnimatedExtension from "@components/Atoms/ItemWrapper";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { forwardRef, memo, MouseEvent, RefObject, useCallback, useRef } from "react";

export interface ItemComponentProps {
	id: string;
	title: string;
	onItemClick: (logicPath: string, target: HTMLElement) => void;
	isSelected: boolean;
	rightActions: JSX.Element;
	rightActionsWidth?: string;
	rightText?: JSX.Element;
	className?: string;
}

const Item = forwardRef((props: ItemComponentProps, ref: RefObject<HTMLDivElement>) => {
	const {
		id,
		title,
		onItemClick,
		isSelected,
		rightActions,
		rightText,
		className,
		rightActionsWidth = "1.5em",
	} = props;

	const Ref = ref || useRef<HTMLDivElement>(null);

	const handleClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			event.stopPropagation();
			event.preventDefault();
			onItemClick(id, Ref.current);
		},
		[id, onItemClick, Ref.current],
	);

	return (
		<div
			ref={Ref}
			className={classNames(className, { selected: isSelected })}
			onClick={handleClick}
			data-qa="qa-clickable"
		>
			<AnimatedExtension
				text={rightText}
				rightActions={rightActions}
				width={rightActionsWidth}
				className="item-wrapper"
			>
				<div className="item">
					<div className="item-header">
						<span className="item-title">{title}</span>
					</div>
				</div>
			</AnimatedExtension>
		</div>
	);
});

export default memo(styled(Item)`
	cursor: pointer;

	.item-wrapper {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.2rem 0;
		line-height: 1.3rem;
		padding-left: 1rem !important;
		padding-right: 0.9rem !important;
		color: var(--color-nav-item);
		font-weight: var(--font-weight-right-nav-active-item);
		overflow: hidden;
	}

	&:hover,
	&:has(*[aria-expanded="true"]) {
		background-color: var(--color-lev-sidebar-hover);
	}

	&:hover .right-actions,
	&:has(*[aria-expanded="true"]) .right-actions {
		padding-left: unset !important;
		width: ${({ rightActionsWidth }) => rightActionsWidth};
		opacity: 1;
		gap: 0.6rem;
		margin-right: 0.2rem;
	}

	&.selected,
	&.selected .item-title {
		color: var(--color-nav-item-selected);
		background-color: var(--color-article-bg);
	}

	.item-header {
		display: flex;
		overflow: hidden;
		align-items: center;
	}

	.item-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.right-extensions {
		display: flex;
		align-items: center;
		padding-right: 1rem;
		white-space: nowrap;
		justify-content: end;
	}
`);
