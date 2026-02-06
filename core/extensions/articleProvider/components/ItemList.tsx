import Item from "@components/Layouts/LeftNavigationTabs/Item";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import { ReactNode, RefObject, useEffect, useMemo, useRef } from "react";
import BaseRightExtensions from "./BaseRightExtensions";

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
				id={item.id}
				isSelected={Array.isArray(selectedId) ? selectedId.includes(item.id) : selectedId === item.id}
				key={item.id}
				onItemClick={onItemClick}
				rightActions={
					onMarkdownChange &&
					onDelete && (
						<BaseRightExtensions
							confirmDeleteText={confirmDeleteText}
							id={item.id}
							items={rightActions}
							onDelete={onDelete}
							onMarkdownChange={onMarkdownChange}
							preDelete={preDelete}
							providerType={providerType}
						/>
					)
				}
				rightActionsWidth="0.85em"
				title={item.title.length ? item.title : t("article.no-name")}
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
