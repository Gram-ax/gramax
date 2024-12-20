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
	breadcrumb?: string[];
	breadcrumbLevel?: number;
}

export interface ButtonItem extends Omit<ListItem, "breadcrumb"> {
	onClick?: () => void;
	icon?: string;
	iconViewBox?: string;
}

interface ConfigProps {
	isHierarchy?: boolean;
	showFilteredItems?: boolean;
	withBreadcrumbs?: boolean;
}

interface ItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "content">, ConfigProps {
	content: ItemContent;
	disable?: boolean;
	isActive?: boolean;
	isLoading?: boolean;
	onHover?: () => void;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

const BreadcrumbContainer = ({ breadcrumb, className, children }) => {
	if (!breadcrumb) return children;

	return (
		<div className={`container ${className}`}>
			<div
				onMouseMove={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				className={"breadcrumbWrapper"}
			>
				<ul className={"breadcrumbList"}>
					{breadcrumb.map((item) => {
						return (
							<li key={item} title={item}>
								<span>{item}</span>
							</li>
						);
					})}
				</ul>
			</div>
			{children}
		</div>
	);
};

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

	const breadcrumb =
		showFilteredItems && typeof content === "object" && "breadcrumb" in content ? content.breadcrumb : undefined;

	const breadcrumbLevel =
		!showFilteredItems && typeof content === "object" && "breadcrumbLevel" in content
			? content.breadcrumbLevel
			: undefined;

	const mods = {
		active: isActive,
		disable,
		haveBreadcrumb: !!breadcrumb,
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
		<BreadcrumbContainer className={className} breadcrumb={withBreadcrumbs ? breadcrumb : false}>
			<div
				ref={ref}
				data-qa="qa-clickable"
				onMouseOver={onHover}
				onClick={!disable ? onClick : null}
				style={isHierarchy && breadcrumbLevel ? { paddingLeft: breadcrumbLevel * 8 } : undefined}
				className={classNames("item", mods, [className])}
				{...otherProps}
			>
				{getContent()}
			</div>
		</BreadcrumbContainer>
	);
});

export default styled(Item)`
	display: flex;
	align-items: center;
	width: 100%;
	line-height: 20px;
	font-size: 14px;
	color: var(--color-article-heading-text);

	strong {
		word-break: break-all;
		color: inherit;
	}

	&.hideRightAction {
		.sidebar-right-actions {
			display: none;
		}

		:hover {
			.sidebar-right-actions {
				display: block;
			}
		}
	}

	.haveBreadcrumb {
		align-items: start;
		flex-direction: column;
		display: flex;
	}

	&.container {
		align-items: start;
		flex-direction: column;
		display: flex;
	}

	.breadcrumbWrapper {
		padding: 4px 13px;
		height: 24px;
		width: 100%;

		.breadcrumbList {
			list-style: none;
			font-size: 12px;
			line-height: 14px;
			height: 16px;
			display: flex;
			flex-wrap: nowrap;
			gap: 3px;
			overflow: hidden;
			width: 100%;

			> li:first-child {
				text-overflow: clip;
				span {
					text-overflow: clip;
				}
			}

			> li {
				margin: unset !important;
				line-height: 1rem;
				overflow: hidden;
				height: 100%;
				text-overflow: ellipsis;
				white-space: nowrap;
				min-width: 0.275rem;
				color: var(--color-primary-general-inverse);

				span {
					line-height: inherit;
					color: inherit;
				}
			}
		}
	}

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
