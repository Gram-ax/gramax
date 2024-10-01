import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { ForwardedRef, forwardRef, HTMLAttributes, MouseEventHandler, ReactElement, ReactNode } from "react";

export type ItemContent = ListItem | ButtonItem | string;

export interface ListItem {
	element: ReactElement | string;
	labelField?: string;
	disable?: boolean;
	tooltipDisabledContent?: ReactNode;
	isTitle?: boolean;
	value?: string;
	loading?: boolean;
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
	isLoading?: boolean;
	onHover?: () => void;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

const Item = forwardRef((props: ItemProps, ref: ForwardedRef<HTMLDivElement>) => {
	const { disable = false, isLoading, className, isActive, content, onHover, onClick, ...otherProps } = props;

	const mods = {
		active: isActive,
		disable,
	};

	const getContent = () => {
		if (isLoading)
			return (
				<div className="loading-element">
					<SpinnerLoader width={14} height={14} />
					&nbsp;
					<span>{t("loading")}</span>
				</div>
			);
		return typeof content === "string" ? content : content.element;
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
			{getContent()}
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
	${(p) =>
		typeof p.content === "string" ||
		typeof p.content?.element === "string" ||
		(typeof p.content !== "string" && p.content.loading)
			? "padding: 6px 12px;"
			: ""}

	&.active {
		cursor: pointer;
		background: var(--color-lev-sidebar-hover);
	}

	&.disable {
		cursor: unset;
		pointer-events: none;
	}

	.loading-element {
		display: flex;
		align-items: center;

		span {
			line-height: normal;
		}
	}
`;
