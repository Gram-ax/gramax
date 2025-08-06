import Item from "@components/Layouts/LeftNavigationTabs/Item";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import t from "@ext/localization/locale/translate";
import { RefObject, useEffect, useRef, useMemo, ReactNode } from "react";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import BaseRightExtensions from "./BaseRightExtensions";
import { ProviderItemProps } from "@ext/articleProvider/models/types";

interface ItemListProps<T = ProviderItemProps> {
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	selectedItemId: string | string[];
	items: T[];
	noItemsText: string;
	providerType?: ArticleProviderType;
	confirmDeleteText?: string;
	onItemClick: (id: string, target: HTMLElement) => void;
	onDelete?: (id: string) => void;
	setContentHeight: (height: number) => void;
	onMarkdownChange?: (id: string, markdown: string) => void;
	preDelete?: (id: string) => Promise<boolean>;
	rightActions?: (id: string) => ReactNode;
}

const ItemList = <T extends ProviderItemProps>(props: ItemListProps<T>) => {
	const {
		show,
		tabWrapperRef,
		setContentHeight,
		providerType,
		items,
		onDelete,
		onMarkdownChange,
		selectedItemId: selectedId,
		rightActions,
		noItemsText,
		onItemClick,
		preDelete,
		confirmDeleteText,
	} = props;
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!ref.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		setContentHeight(calculateTabWrapperHeight(mainElement));
	}, [show, items.length]);

	const itemList = useMemo(() => {
		return items.map((item) => (
			<Item
				key={item.id}
				id={item.id}
				title={item.title.length ? item.title : t("article.no-name")}
				isSelected={Array.isArray(selectedId) ? selectedId.includes(item.id) : selectedId === item.id}
				rightActionsWidth="0.85em"
				onItemClick={onItemClick}
				rightActions={
					onMarkdownChange &&
					onDelete && (
						<BaseRightExtensions
							id={item.id}
							providerType={providerType}
							onDelete={onDelete}
							onMarkdownChange={onMarkdownChange}
							items={rightActions}
							preDelete={preDelete}
							confirmDeleteText={confirmDeleteText}
						/>
					)
				}
			/>
		));
	}, [items, selectedId, onItemClick, providerType, rightActions, confirmDeleteText]);

	if (!show) return;

	return (
		<div ref={ref}>
			{items.length ? itemList : <div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>{noItemsText}</div>}
		</div>
	);
};

export default ItemList;
