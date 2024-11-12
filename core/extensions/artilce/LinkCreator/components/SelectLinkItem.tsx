import GoToArticle from "@components/Actions/GoToArticle";
import { ListItem } from "@components/List/Item";
import { OnItemClick } from "@components/List/Items";
import ListLayout, { ListLayoutElement } from "@components/List/ListLayout";
import LinkTitleContextService from "@core-ui/ContextServices/LinkTitleTooltip";
import { useCtrlKey } from "@core-ui/hooks/useCtrlKey";
import { useExternalLink } from "@core-ui/hooks/useExternalLink";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import eventEmitter from "@core/utils/eventEmmiter";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import styled from "@emotion/styled";
import LinkItemSidebar from "@ext/artilce/LinkCreator/components/LinkItemSidebar";
import t from "@ext/localization/locale/translate";
import Button, { ButtonProps } from "@ext/markdown/core/edit/components/Menu/Button";
import LinkFocusTooltip from "@ext/markdown/elements/link/edit/logic/LinkFocusTooltip";
import { Dispatch, RefObject, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import LinkItem from "../models/LinkItem";

interface SelectLinkItemProps {
	href: string;
	value: string;
	focusOnMount: boolean;
	itemLinks: LinkItem[];
	onChange: (value: string, href: string) => void;
	className?: string;
}

interface ButtonViewProps {
	isExternalLink: boolean;
	href: string;
	icon: string;
	itemName: string;
	setButton: Dispatch<SetStateAction<boolean>>;
}

interface ListViewProps {
	focusOnMount: boolean;
	items: ListItem[];
	onSearchChange: (value: string) => void;
	itemClickHandler: OnItemClick;
	listRef: RefObject<ListLayoutElement>;
	itemIndex: null | number;
	itemName?: string;
	className?: string;
	inputValue?: string;
}

const getBreadcrumb = (breadcrumb: string[], prevBreadcrumb: string[]): string[] | undefined => {
	if (!breadcrumb || !breadcrumb.length) return;
	if (breadcrumb.join("") === prevBreadcrumb.join("")) return;
	if (breadcrumb.length === 1) return breadcrumb.slice();
	if (breadcrumb.length === 2) return [breadcrumb[0], "/", breadcrumb[1]];

	return [breadcrumb[0], "/", "...", "/", breadcrumb[breadcrumb.length - 1]];
};

const renderItem = (item: LinkItem, index, arr): ListItem => {
	const { type, title, breadcrumb } = item;

	const iconCode = type === ItemType.article ? "file" : "folder";
	const itemBreadcrumb = getBreadcrumb(breadcrumb, arr[index - 1]?.breadcrumb);
	const itemBreadcrumbLevel = breadcrumb?.length || undefined;

	return {
		element: <LinkItemSidebar title={title} iconCode={iconCode} item={item} />,
		labelField: title,
		breadcrumb: itemBreadcrumb,
		breadcrumbLevel: itemBreadcrumbLevel,
	};
};

interface StyledButtonProps extends ButtonProps {
	isTauri?: boolean;
}

export const StyledButton = styled(Button)<StyledButtonProps>`
	.button .iconFrame {
		display: flex;
	}

	.button .iconFrame span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: ${(p) => (p.isTauri ? 203 : 168)}px;
	}

	.button .iconFrame i {
		align-items: flex-start;
		justify-content: center;
		display: flex;
	}
`;

const ButtonView = ({ href, icon, itemName, setButton, isExternalLink }: ButtonViewProps) => {
	const { isCtrlPressed } = useCtrlKey();
	const { isTauri } = usePlatform();

	const desktopBehavior = isExternalLink ? "_blank" : "_self";
	const browserBehavior = isExternalLink || isCtrlPressed ? "_blank" : "_self";
	const target = isTauri ? desktopBehavior : browserBehavior;

	const editButtonHandler = () => {
		setButton(false);
	};

	const commonStyle = { color: "var(--color-article-bg)", width: "100%", textDecoration: "none" };

	const ButtonContent = <StyledButton title={itemName} icon={icon} text={itemName} isTauri={isTauri} />;

	const hashHatch = LinkFocusTooltip.getLinkToHeading(href);
	const isCurrentLink = typeof window !== "undefined" ? window.location.pathname === hashHatch?.[1] : false;
	const isHashLink = hashHatch?.[2] && isCurrentLink;
	return (
		<>
			{target === "_blank" || isHashLink ? (
				<a
					target={target}
					style={commonStyle}
					rel="noopener noreferrer"
					href={isHashLink ? hashHatch?.[2] : href}
				>
					{ButtonContent}
				</a>
			) : (
				<div style={commonStyle}>
					<GoToArticle style={commonStyle} href={href} trigger={ButtonContent} />
				</div>
			)}

			<div className="divider" />
			<Button icon="pencil" onClick={editButtonHandler} tooltipText={t("edit2")} />
		</>
	);
};

const ListView = (props: ListViewProps) => {
	const { listRef, focusOnMount, className, itemIndex, onSearchChange, itemClickHandler, items, itemName } = props;
	const { parentRef } = LinkTitleContextService.value;

	return (
		<div ref={parentRef} style={{ padding: "0 5.5px", width: "300px" }}>
			<ListLayout
				containerRef={parentRef}
				addWidth={8}
				itemsClassName={className}
				openByDefault={focusOnMount}
				items={items}
				item={itemName}
				itemIndex={itemIndex}
				ref={listRef}
				isCode={false}
				placeholder={t("list.search-articles")}
				onSearchChange={onSearchChange}
				onItemClick={itemClickHandler}
				customOutsideClick
				withBreadcrumbs
				keepFullWidth
				isHierarchy
			/>
		</div>
	);
};

const getItemByItemLinks = (itemLinks: LinkItem[], value, href) => {
	const indexLinkToArticle = itemLinks.findIndex((i) => i.relativePath === value);
	const linkToArticle = indexLinkToArticle !== -1 ? itemLinks[indexLinkToArticle] : null;

	const indexLinkToHeader = itemLinks.findIndex((i) => {
		const match = LinkFocusTooltip.getLinkToHeading(value);
		return i.relativePath === (match ? match[1] : href);
	});
	const linkToHeader = indexLinkToHeader !== -1 ? itemLinks[indexLinkToHeader] : null;

	if (!linkToHeader && !linkToArticle) return { item: null, index: null };

	if (linkToHeader) return { item: linkToHeader, index: indexLinkToHeader };

	return { item: linkToArticle, index: indexLinkToArticle };
};

type getItemsType = {
	itemLinks: LinkItem[];
	isExternalLink?: boolean;
	externalLink?: string;
};

const getItemsByItemLinks = (props: getItemsType): ListItem[] => {
	const { itemLinks, isExternalLink, externalLink } = props;
	if (isExternalLink)
		return [{ element: <LinkItemSidebar title={externalLink} iconCode={"globe"} />, labelField: externalLink }];
	if (!itemLinks) return [];
	return itemLinks.map(renderItem);
};

const SelectLinkItem = (props: SelectLinkItemProps) => {
	const { href, value, onChange, itemLinks, className, focusOnMount } = props;
	const [isExternalLink, externalLink, setExternalLink] = useExternalLink(href);

	const { item } = useMemo(
		() => getItemByItemLinks(itemLinks, value, href),
		[value, itemLinks, isExternalLink, href, externalLink],
	);

	const items = useMemo(
		() => getItemsByItemLinks({ itemLinks, isExternalLink, externalLink }),
		[itemLinks, isExternalLink, externalLink],
	);

	const currentItemIndex = itemLinks.findIndex((item) => item.isCurrent);

	const icon = !item ? "globe" : item.type == ItemType.article ? "file" : "folder";
	const [isButton, setIsButton] = useState(!!item || isExternalLink);
	const [isEdit, setIsEdit] = useState(false);
	const [itemName, setItemName] = useState("");
	const listRef = useRef<ListLayoutElement>();

	const setName = (withHash = true) => {
		if (!item || !item.title || !value) return setItemName(value || "");

		const { title } = item;
		const hash = LinkFocusTooltip.getLinkToHeading(value);

		if (hash && withHash && !isEdit) {
			setItemName(title + decodeURI(hash[2]));
		} else {
			setItemName(title);
		}
	};

	useEffect(() => {
		setName();
	}, [item, externalLink, isEdit]);

	const itemClickHandler = (_, __, idx) => {
		if (isExternalLink) onChange(externalLink, externalLink);
		else onChange(itemLinks[idx].relativePath, itemLinks[idx].pathname);
	};

	useEffect(() => {
		const handleItemClick = ({ path, href }: { path: string; href: string }) => {
			onChange(path, href);
		};

		eventEmitter.on("itemTitleLinkClick", handleItemClick);

		return () => {
			eventEmitter.off("itemTitleLinkClick", handleItemClick);
		};
	}, [onChange, itemLinks]);

	useEffect(() => {
		const { domain } = parseStorageUrl(value);

		if (isEdit && domain && domain !== "...") listRef.current.searchRef.inputRef.select();
	}, [isEdit]);

	const setButtonHandler = (value) => {
		setIsButton(value);
		setName(false);
		setIsEdit(true);
	};

	if (isButton) {
		return (
			<ButtonView
				isExternalLink={isExternalLink}
				href={href}
				icon={icon}
				itemName={itemName}
				setButton={setButtonHandler}
			/>
		);
	}

	return (
		<ListView
			focusOnMount={focusOnMount}
			itemName={itemName}
			itemIndex={currentItemIndex !== -1 ? currentItemIndex : undefined}
			items={items}
			listRef={listRef}
			className={className}
			onSearchChange={setExternalLink}
			itemClickHandler={itemClickHandler}
		/>
	);
};

export default styled(SelectLinkItem)`
	margin-top: 4px;

	border-radius: var(--radius-large);
	background: var(--color-tooltip-background);

	.item,
	.breadcrumb {
		color: var(--color-article-bg);

		.link {
			line-height: 1.5em;
		}
	}

	.item.active {
		background: var(--color-edit-menu-button-active-bg);
		.hidden_elem {
			opacity: 1;
		}
	}
`;
