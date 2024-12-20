import Icon from "@components/Atoms/Icon";
import Link from "@components/Atoms/Link";
import { classNames } from "@components/libs/classNames";
import Url from "@core-ui/ApiServices/Types/Url";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { HTMLAttributes } from "react";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";
/* eslint-disable @typescript-eslint/no-unused-vars */

interface LevNavItemProps extends HTMLAttributes<HTMLDivElement> {
	level: number;
	item?: ItemLink;
	isOpen?: boolean;
	isHover?: boolean;
	isActive?: boolean;
	isCategory?: boolean;
	isDropTarget?: boolean;
	isDragStarted?: boolean;
	rightExtensions?: JSX.Element | JSX.Element[];
	leftExtensions?: JSX.Element | JSX.Element[];
	onToggle?: () => void;
	className?: string;
}

const LevNavItem = (props: LevNavItemProps) => {
	const {
		level,
		item,
		isOpen,
		rightExtensions,
		leftExtensions,
		onToggle,
		className,
		isCategory,
		isDragStarted,
		isDropTarget,
		isActive,
		isHover,
		...other
	} = props;
	const articleProps = ArticlePropsService.value;
	const title = item ? (articleProps?.ref?.path == item?.ref?.path ? articleProps?.title : item?.title) : null;
	const existsContent = item?.type === ItemType.category ? (item as CategoryLink)?.existContent : true;

	let status = FileStatus[item.status];
	if (articleProps?.ref?.path == item?.ref?.path && articleProps.status && status != FileStatus.new)
		status = FileStatus[articleProps.status];

	const Item = (
		<div
			className={classNames(`${className} depth-${level}`, {
				"a-drop-target": !isOpen && isCategory,
				[status]: !!status,
			})}
			data-qa={`catalog-navigation-${isCategory ? "category" : "article"}-link-level-${level}`}
			{...other}
		>
			{isCategory && (
				<Icon
					code={isOpen ? "chevron-down" : "chevron-right"}
					viewBox="3 3 18 18"
					isAction
					className="angle"
					onClick={onToggle}
					onClickCapture={(e) => e.preventDefault()}
				/>
			)}
			<div className="text" data-qa="qa-clickable">
				<span title={title}>{item?.external || title || <>&nbsp;</>}</span>
				{leftExtensions}
			</div>
			{rightExtensions && (
				<div className="right-extensions" onClickCapture={(e) => e.preventDefault()}>
					{rightExtensions}
				</div>
			)}
		</div>
	);

	if (!item || articleProps?.ref?.path == item?.ref?.path || !existsContent) return Item;
	return <Link href={Url.from(item)}>{Item}</Link>;
};

export default styled(LevNavItem)`
	display: flex;
	position: relative;
	padding: 5px 0;
	cursor: pointer;
	font-weight: var(--font-weight-default);
	align-items: center;
	padding-right: 14px !important;
	padding-left: var(--left-padding) !important;
	${(p) => (p.item.external ? "color: var(--color-primary-general-inverse)" : "color: var(--color-nav-item)")};

	&.modified::after {
		background-color: var(--color-status-modified);
	}

	&.new::after {
		background-color: var(--color-status-new);
	}

	&::after {
		content: "";
		display: flex;
		align-items: center;
		position: absolute;
		left: 0;
		top: 10%;
		width: 3px;
		height: 80%;
	}

	${(p) =>
		p.level !== 0
			? ``
			: `
	font-weight: 500;
`}
	${(p) =>
		!(p.isHover ?? false)
			? ``
			: `
	background: var(--color-lev-sidebar-hover);

	.right-extensions {
		display: inline-flex !important;
	}
`}

	${(p) =>
		!(p.isActive ?? false)
			? ""
			: `
	background: var(--color-article-bg);    
    color: var(--color-nav-item-selected);
	font-weight: var(--font-weight-right-nav-active-item);

	.right-extensions {
		display: inline-flex !important;
	}
    
	:hover {
		background: var(--color-article-bg);
	}
    `}

	> i,
	> div,
	> span {
		margin-left: 0 !important;
		padding-left: 0 !important;
	}

	> i.angle {
		margin-right: 0 !important;
		margin-left: -15px !important;
	}

	.text {
		flex: 1;
		display: flex;
		overflow: hidden;
		align-items: center;

		> span {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.right-extensions {
		display: none;
		margin-right: 0;
		align-items: center;
		justify-content: flex-end;
		gap: var(--distance-i-span);
		margin-left: var(--distance-i-span) !important;

		i {
			padding: 0;
			font-size: 14px !important;
		}
	}

	${(p) =>
		p.isDragStarted
			? ``
			: `
	:hover {
		background: var(--color-lev-sidebar-hover);

		.right-extensions {
			display: inline-flex;
		}
	}
	`}
	${(p) =>
		p.isDragStarted &&
		p.isDropTarget &&
		!p.isCategory &&
		`
			background: var(--color-nav-article-drop-target) !important;
		`}
`;
