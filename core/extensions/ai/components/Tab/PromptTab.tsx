import { TextSize } from "@components/Atoms/Button/Button";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import generateUniqueID from "@core/utils/generateUniqueID";
import styled from "@emotion/styled";
import PromptService from "@ext/ai/components/Tab/PromptService";
import ItemList from "@ext/articleProvider/components/ItemList";
import PopoverUtility from "@ext/articleProvider/logic/PopoverUtility";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import TemplateService from "@ext/templates/components/TemplateService";
import { useCallback, useEffect, useRef, useState } from "react";

const ExtensionWrapper = styled.div`
	margin-left: -0.5em;
`;

interface PromptTab {
	show: boolean;
}

const PromptTab = ({ show }: PromptTab) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedIds, items } = PromptService.value;

	const addNewNote = useCallback(async () => {
		const uniqueID = generateUniqueID();
		await FetchService.fetch(apiUrlCreator.createFileInGramaxDir(uniqueID, "prompt"));

		const res = await FetchService.fetch<ProviderItemProps[]>(apiUrlCreator.getArticleListInGramaxDir("prompt"));
		if (!res.ok) return;

		const newItems = await res.json();
		PromptService.setItems(newItems);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedIds.length) return;

		const listener = () => {
			TemplateService.closeTemplate();
			refreshPage();
		};

		const clickToken = NavigationEvents.on("item-click", listener);
		const createToken = NavigationEvents.on("item-create", listener);
		const deleteToken = NavigationEvents.on("item-delete", listener);

		return () => {
			NavigationEvents.off(clickToken);
			NavigationEvents.off(createToken);
			NavigationEvents.off(deleteToken);
		};
	}, [selectedIds]);

	useEffect(() => {
		if (!show) return;

		PromptService.fetchList(apiUrlCreator);
	}, [show]);

	const onItemClick = useCallback(
		(id: string, target: HTMLElement) => {
			if (selectedIds.includes(id)) {
				const newIds = PopoverUtility.removeSelectedIds(selectedIds, id);
				PromptService.setSelectedIds(newIds);
				PromptService.closeNote(id);
				return;
			}

			const tooltipManager = PromptService.getTooltipManager();
			const unpinnedTooltips = tooltipManager.getUnpinnedTooltips();

			const unpinnedIds = unpinnedTooltips.map((tooltip) => tooltip.item.id);
			const newIds = PopoverUtility.removeSelectedIds(
				PopoverUtility.setSelectedIds(selectedIds, [id]),
				unpinnedIds,
			);

			unpinnedTooltips.forEach((tooltip) => tooltipManager.removeTooltip(tooltip));
			PromptService.setSelectedIds(newIds);
			PromptService.openNote(
				items.find((item) => item.id === id),
				target,
			);
		},
		[selectedIds, items],
	);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedIds.includes(id)) {
				PromptService.closeNote(id);
			}

			const newItems = Array.from(items.values()).filter((t) => t.id !== id);
			PromptService.setItems(newItems);
		},
		[selectedIds, items],
	);

	const onMarkdownChange = useCallback(
		(id: string) => {
			if (selectedIds.includes(id)) {
				const tooltip = PromptService.closeNote(id);

				setTimeout(() => {
					PromptService.openNote(
						items.find((item) => item.id === id),
						tooltip.element,
					);
				}, 0);
			}
		},
		[selectedIds, items],
	);

	return (
		<TabWrapper
			ref={tabWrapperRef}
			isTop
			show={show}
			title=""
			contentHeight={height}
			titleRightExtension={
				<ExtensionWrapper>
					<ButtonLink
						textSize={TextSize.S}
						text={t("ai.prompt.new-prompt")}
						style={{ marginLeft: "-8px" }}
						iconCode="plus"
						onClick={addNewNote}
					/>
				</ExtensionWrapper>
			}
		>
			<ItemList
				tabWrapperRef={tabWrapperRef}
				show={show}
				setContentHeight={setHeight}
				items={items}
				selectedItemId={selectedIds}
				providerType="prompt"
				noItemsText={t("ai.prompt.no-prompts")}
				onItemClick={onItemClick}
				onDelete={onDelete}
				onMarkdownChange={onMarkdownChange}
			/>
		</TabWrapper>
	);
};

export default PromptTab;
