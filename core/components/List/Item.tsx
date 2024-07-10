import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ForwardedRef, HTMLAttributes, MouseEventHandler, ReactNode, forwardRef, ReactElement } from "react";

export type ItemContent = ListItem | ButtonItem | string;

export interface ListItem {
	element: ReactElement | string;
	labelField?: string;
	disable?: boolean;
	tooltipDisabledContent?: ReactNode;
	isTitle?: boolean;
	value?: string;
}

export interface ButtonItem extends ListItem {
	onClick?: () => void;
	icon?: string;
	iconViewBox?: string;
}

interface ItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
	content: ItemContent;
	disable?: boolean;
	isActive?: boolean;
	onHover?: () => void;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

const Item = forwardRef((props: ItemProps, ref: ForwardedRef<HTMLDivElement>) => {
	const { disable = false, className, isActive, content, onHover, onClick, ...otherProps } = props;

	const mods = {
		active: isActive,
		disable,
	};

	return (
		<div
			ref={ref}
			data-qa="qa-clickable"
			onMouseOver={onHover}
			onClick={!disable ? onClick : null}
			className={classNames("item", mods, [className])}
			{...otherProps}
		>
			{typeof content === "string" ? content : content.element}
		</div>
	);
});

export default styled(Item)`
	display: flex;
	align-items: center;
	width: 100%;
	line-height: 20px;
	font-size: 14px;
	color: var(--color-article-heading-text);
	${(p) => (typeof p.content === "string" || typeof p.content?.element === "string" ? "padding: 6px 12px;" : "")}

	${(p) => (p.isActive ? "cursor: pointer; background: var(--color-lev-sidebar-hover);" : "")}
	
	&.disable {
		cursor: unset;
		pointer-events: none;
	}
`;
