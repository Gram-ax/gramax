import Icon from "@components/Atoms/Icon";
import Link from "@components/Atoms/Link";
import { classNames } from "@components/libs/classNames";
import Url from "@core-ui/ApiServices/Types/Url";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import { isFromModal } from "@ui-kit/Modal";
import { HTMLAttributes } from "react";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";
import { cssMedia } from "@core-ui/utils/cssUtils";
/* eslint-disable @typescript-eslint/no-unused-vars */

interface LevNavItemProps extends HTMLAttributes<HTMLDivElement> {
	level: number;
	item?: ItemLink;
	isOpen?: boolean;
	isHover?: boolean;
	isCategory?: boolean;
	isDropTarget?: boolean;
	isDragStarted?: boolean;
	rightExtensions?: JSX.Element;
	leftExtensions?: JSX.Element;
	onToggle?: () => void;
	className?: string;
}

const Item = ({
	level,
	item,
	isOpen,
	isCategory,
	className,
	onToggle,
	rightExtensions,
	leftExtensions,
	title,
	currentTitle,
	status,
	isActive,
	isDragStarted,
	isDropTarget,
	isHover,
	...other
}: LevNavItemProps & {
	currentTitle: string;
	status: string;
	isActive?: boolean;
}) => {
	return (
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
					onClick={(e) => {
						e.stopPropagation();
						onToggle();
					}}
					onClickCapture={(e) => e.preventDefault()}
				/>
			)}
			<div className="text" data-qa="qa-clickable">
				<span title={title}>{currentTitle || item?.external || title || <>&nbsp;</>}</span>
				{leftExtensions}
			</div>
			{rightExtensions && (
				<div
					className="right-extensions"
					onClickCapture={(e) => {
						if (isFromModal(e)) return;
						e.preventDefault();
					}}
				>
					{rightExtensions}
				</div>
			)}
		</div>
	);
};

const StyledItem = styled(Item)`
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
		margin-right: 1px;

		i {
			padding: 0;
			font-size: 14px !important;
		}
	}

	${(p) =>
		p.isDragStarted &&
		p.isDropTarget &&
		!p.isCategory &&
		`
			background: var(--color-nav-article-drop-target) !important;
		`}

	${cssMedia.moreThanNarrow} {
		:hover {
			background: var(--color-lev-sidebar-hover);

			.right-extensions {
				display: inline-flex;
			}
		}

		${(p) =>
			!(p.isActive ?? false)
				? ""
				: `
			:hover {
				background: var(--color-article-bg);
			}
		`}
	}
`;

const LevNavItem = (props: LevNavItemProps) => {
	const { item } = props;
	const articleProps = ArticlePropsService.value;
	const title = item ? (articleProps?.ref?.path == item?.ref?.path ? articleProps?.title : item?.title) : null;
	const currentTitle = articleProps?.ref?.path == item?.ref?.path ? articleProps?.title : null;
	const existsContent = item?.type === ItemType.category ? (item as CategoryLink)?.existContent : true;
	const status = GitIndexService.getStatusByPath(item?.ref?.path);

	if (!item || articleProps?.ref?.path == item?.ref?.path || !existsContent) {
		return <StyledItem {...props} currentTitle={currentTitle} status={status} title={title} isActive={true} />;
	}
	return (
		<Link href={Url.from(item)}>
			<StyledItem {...props} currentTitle={currentTitle} status={status} title={title} />
		</Link>
	);
};

export default LevNavItem;
