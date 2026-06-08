import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import generateUniqueID from "@core/utils/generateUniqueID";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { promptStore, usePromptStore } from "@ext/ai/components/Tab/PromptStore";
import ItemList from "@ext/articleProvider/components/ItemList";
import PopoverUtility from "@ext/articleProvider/logic/PopoverUtility";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useRef, useState } from "react";

interface PromptTab {
	show: boolean;
}

const PromptTab = ({ show }: PromptTab) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedIds, items } = usePromptStore((s) => ({ selectedIds: s.selectedIds, items: s.items }), "shallow");

	const addNewNote = useCallback(async () => {
		const uniqueID = generateUniqueID();
		await FetchService.fetch(apiUrlCreator.createFileInGramaxDir(uniqueID, "prompt"));

		const res = await FetchService.fetch<ProviderItemProps[]>(apiUrlCreator.getArticleListInGramaxDir("prompt"));
		if (!res.ok) return;

		const newItems = await res.json();
		promptStore.getState().setItems(newItems);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedIds.length) return;
		const branchListener = () => {
			selectedIds.forEach((id) => promptStore.getState().closeNote(id));
		};

		const listener = () => {
			branchListener();
			refreshPage();
		};

		const clickToken = NavigationEvents.on("item-click", listener);
		const createToken = NavigationEvents.on("item-create", listener);
		const deleteToken = NavigationEvents.on("item-delete", listener);
		BranchUpdaterService.addListener(branchListener);

		return () => {
			NavigationEvents.off(clickToken);
			NavigationEvents.off(createToken);
			NavigationEvents.off(deleteToken);
			BranchUpdaterService.removeListener(branchListener);
		};
	}, [selectedIds]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional???
	useEffect(() => {
		if (!show) return;

		promptStore.getState().fetchList(apiUrlCreator);
	}, [show]);

	const onItemClick = useCallback(
		(id: string, target: HTMLElement) => {
			if (selectedIds.includes(id)) {
				const newIds = PopoverUtility.removeSelectedIds(selectedIds, id);
				promptStore.getState().setSelectedIds(newIds);
				promptStore.getState().closeNote(id);
				return;
			}

			const tooltipManager = promptStore.getState().tooltipManager;
			const unpinnedTooltips = tooltipManager.getUnpinnedTooltips();

			const unpinnedIds = unpinnedTooltips.map((tooltip) => tooltip.item.id);
			const newIds = PopoverUtility.removeSelectedIds(
				PopoverUtility.setSelectedIds(selectedIds, [id]),
				unpinnedIds,
			);

			unpinnedTooltips.forEach((tooltip) => tooltipManager.removeTooltip(tooltip));
			promptStore.getState().setSelectedIds(newIds);
			promptStore.getState().openNote(
				items.find((item) => item.id === id),
				target,
			);
		},
		[selectedIds, items],
	);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedIds.includes(id)) {
				promptStore.getState().closeNote(id);
			}

			const newItems = Array.from(items.values()).filter((t) => t.id !== id);
			promptStore.getState().setItems(newItems);
		},
		[selectedIds, items],
	);

	const onMarkdownChange = useCallback(
		(id: string) => {
			if (selectedIds.includes(id)) {
				const element = promptStore.getState().closeNote(id);

				setTimeout(() => {
					promptStore.getState().openNote(
						items.find((item) => item.id === id),
						element,
					);
				}, 0);
			}
		},
		[selectedIds, items],
	);

	return (
		<TabWrapper
			contentHeight={height}
			isTop
			ref={tabWrapperRef}
			show={show}
			title=""
			titleRightExtension={
				<Button className="p-0 h-auto" onClick={addNewNote} size="sm" startIcon="plus" variant="text">
					{t("ai.prompt.new-prompt")}
				</Button>
			}
		>
			<ItemList
				confirmDeleteText={t("confirm-prompts-delete")}
				items={items}
				noItemsText={t("ai.prompt.no-prompts")}
				onDelete={onDelete}
				onItemClick={onItemClick}
				onMarkdownChange={onMarkdownChange}
				providerType="prompt"
				selectedItemId={selectedIds}
				setContentHeight={setHeight}
				show={show}
				tabWrapperRef={tabWrapperRef}
			/>
		</TabWrapper>
	);
};

export default PromptTab;
