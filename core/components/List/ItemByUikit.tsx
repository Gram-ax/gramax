import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { classNames } from "@components/libs/classNames";
import { ItemProps } from "./Item";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { ForwardedRef, forwardRef } from "react";

const itemClass =
	"relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm text-primary-fg outline-none focus:bg-secondary-bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

const Item = forwardRef((props: ItemProps, ref: ForwardedRef<HTMLDivElement>) => {
	const {
		disable = false,
		isLoading,
		isHierarchy,
		withBreadcrumbs,
		showFilteredItems,
		className,
		isActive,
		content,
		onHover,
		onClick,
		...otherProps
	} = props;

	const mods = {
		active: isActive,
		disable,
		hideRightAction: isHierarchy || withBreadcrumbs,
	};

	const getContent = () => {
		if (isLoading) {
			return (
				<div className="loading-element">
					<SpinnerLoader width={14} height={14} />
					&nbsp;
					<span>{t("loading")}</span>
				</div>
			);
		}

		return typeof content === "string" ? content : content.element;
	};

	return (
		<div
			ref={ref}
			data-qa="qa-clickable"
			onMouseOver={onHover}
			onClick={!disable ? onClick : null}
			className={classNames("item", mods, [className, itemClass])}
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

	background-color: transparent;

	:focus,
	:hover {
		background-color: hsl(var(--secondary-bg-hover));
	}

	&.container {
		align-items: start;
		flex-direction: column;
		display: flex;
	}

	&.active {
		cursor: pointer;
		background-color: hsl(var(--secondary-bg-hover));
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
