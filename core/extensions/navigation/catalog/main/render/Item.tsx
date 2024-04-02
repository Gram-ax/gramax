import Icon from "@components/Atoms/Icon";
import Link from "@components/Atoms/Link";
import Url from "@core-ui/ApiServices/Types/Url";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import { DragOverProps } from "@minoru/react-dnd-treeview";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";

const LevNavItem = styled(
	({
		level,
		item,
		isOpen,
		isDroppable = false,
		dragOverProps,
		rightExtensions,
		leftExtensions,
		onClick,
		onToggle,
		className,
	}: {
		level: number;
		item?: ItemLink;
		isOpen?: boolean;
		isHover?: boolean;
		isActive?: boolean;
		isDroppable?: boolean;
		dragOverProps?: DragOverProps;
		rightExtensions?: JSX.Element | JSX.Element[];
		leftExtensions?: JSX.Element | JSX.Element[];
		onClick?: () => void;
		onToggle?: () => void;
		className?: string;
	}) => {
		const articleProps = ArticlePropsService.value;
		const title = item ? (articleProps?.ref?.path == item?.ref?.path ? articleProps?.title : item?.title) : null;
		const existsContent = item?.type === ItemType.category ? (item as CategoryLink)?.existContent : true;

		const Item = (
			<div
				// onContextMenu={(e) => e.preventDefault()}
				className={className + " depth-" + level + (!isOpen && isDroppable ? " a-drop-target" : "")}
				data-qa={`catalog-navigation-${isDroppable ? "category" : "article"}-link-level-${level}`}
				onClick={onClick}
				{...dragOverProps}
			>
				{isDroppable && (
					<Icon
						code={isOpen ? "angle-down" : "angle-right"}
						faFw
						isAction
						className="angle"
						onClick={onToggle}
						onClickCapture={(e) => e.preventDefault()}
					/>
				)}
				<div className="text" data-qa="qa-clickable">
					<span>{title}</span>
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
	},
)`
	display: flex;
	padding: 5px 0;
	cursor: pointer;
	font-weight: 300;
	align-items: baseline;
	padding-right: 20px !important;
	padding-left: var(--left-padding) !important;
	color: var(--color-primary-general) !important;

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
	background: var(--color-article-bg);    
    color: var(--color-primary);
	font-weight: 400;

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
		width: 12px;
		margin-right: 0 !important;
		margin-left: -12px !important;
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
`;

export default LevNavItem;
