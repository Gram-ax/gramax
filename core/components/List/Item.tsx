import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ForwardedRef, MouseEventHandler, ReactNode, forwardRef, HTMLAttributes } from "react";

export type ItemContent = ListItem | ButtonItem | string;

export interface ListItem {
	element: ReactNode | string;
	labelField: string;
	disable?: boolean;
}

export interface ButtonItem extends ListItem {
	onCLick?: () => void;
	icon?: string;
}

interface ItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
	content: ItemContent;
	disable?: boolean;
	isActive?: boolean;
	onHover?: () => void;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

const Item = forwardRef((props: ItemProps, ref: ForwardedRef<HTMLDivElement>) => {
	const { content, disable = false, isActive, onHover, onClick, className, ...otherProps } = props;

	return (
		<div
			ref={ref}
			data-qa="qa-clickable"
			onMouseOver={onHover}
			style={disable ? { pointerEvents: "none" } : {}}
			onClick={!disable && onClick}
			className={classNames("item", { active: isActive }, [className])}
			{...otherProps}
		>
			{typeof content === "string" ? content : content?.element}
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
`;
