import GoToArticle from "@components/Actions/GoToArticle";
import { ListItem } from "@components/List/Item";
import ListLayout, { ListLayoutElement } from "@components/List/ListLayout";
import { useCtrlKey } from "@core-ui/hooks/useCtrlKey";
import { useExternalLink } from "@core-ui/hooks/useExternalLink";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import styled from "@emotion/styled";
import LinkItemSidebar from "@ext/artilce/LinkCreator/components/LinkItemSidebar";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
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
	itemName?: string;
	listRef: RefObject<ListLayoutElement>;
	className?: string;
	onSearchChange: (value: string) => void;
	itemClickHandler: (labelField: unknown, e: unknown, idx: number) => void;
	items: ListItem[];
	inputValue?: string;
}

const renderItem = (item) => {
	const { type, title } = item;

	return {
		element: type === "article" ? LinkItemSidebar(title, "file") : LinkItemSidebar(title, "folder"),
		labelField: title,
	};
};

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

	const ButtonContent = <Button className={"buttonView"} title={itemName} icon={icon} text={itemName} />;

	return (
		<>
			{target === "_blank" ? (
				<a href={href} target={target} rel="noopener noreferrer" style={commonStyle}>
					{ButtonContent}
				</a>
			) : (
				<div style={commonStyle}>
					<GoToArticle style={commonStyle} href={href} trigger={ButtonContent} />
				</div>
			)}

			<div className="divider" />
			<Button icon="pen" onClick={editButtonHandler} tooltipText="Редактировать" />
		</>
	);
};

const ListView = (props: ListViewProps) => {
	const { listRef, focusOnMount, className, onSearchChange, itemClickHandler, items, itemName } = props;

	return (
		<div style={{ padding: "0 5.5px", width: "300px" }}>
			<ListLayout
				openByDefault={focusOnMount}
				item={itemName}
				ref={listRef}
				isCode={false}
				placeholder="Cсылка"
				itemsClassName={className}
				onSearchChange={onSearchChange}
				onItemClick={itemClickHandler}
				items={items}
			/>
		</div>
	);
};

const SelectLinkItem = (props: SelectLinkItemProps) => {
	const { href, value, onChange, itemLinks, className, focusOnMount } = props;

	const [isExternalLink, externalLink, setExternalLink] = useExternalLink(href);

	const item = itemLinks ? itemLinks.find((i) => i.relativePath === value) : null;
	const icon = !item ? "globe" : item.type == ItemType.article ? "file" : "folder";

	const [button, setButton] = useState<boolean>(!!item || isExternalLink);
	const [isEdit, setIsEdit] = useState(false);
	const [itemName, setItemName] = useState("");
	const listRef = useRef<ListLayoutElement>();

	const items = isExternalLink
		? [{ element: LinkItemSidebar(externalLink, "globe"), labelField: externalLink }]
		: itemLinks
		? itemLinks.map(renderItem)
		: [];

	useEffect(() => {
		setItemName((item?.title ?? value) || "");
	}, [item, externalLink]);

	const itemClickHandler = useCallback(
		(_, __, idx) => {
			if (isExternalLink) {
				onChange(externalLink, externalLink);
			} else {
				onChange(itemLinks[idx].relativePath, itemLinks[idx].pathname);
			}
		},
		[isExternalLink, externalLink, itemLinks],
	);

	useEffect(() => {
		const { domain } = parseStorageUrl(value);

		if (isEdit && domain && domain !== "...") {
			listRef.current.searchRef.inputRef.select();
		}
	}, [isEdit]);

	const setButtonHandler = (value) => {
		setButton(value);
		setIsEdit(true);
	};

	return button ? (
		<ButtonView
			isExternalLink={isExternalLink}
			href={href}
			icon={icon}
			itemName={itemName}
			setButton={setButtonHandler}
		/>
	) : (
		<ListView
			focusOnMount={focusOnMount}
			itemName={itemName}
			items={items}
			listRef={listRef}
			className={className}
			onSearchChange={setExternalLink}
			itemClickHandler={itemClickHandler}
		/>
	);
};

export default styled(SelectLinkItem)`
	left: 0;
	margin-top: 4px;
	min-width: 238px;
	margin-left: -9px;
	border-radius: var(--radius-big-block);
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
	}
`;
