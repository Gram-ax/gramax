import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import generateUniqueID from "@core/utils/generateUniqueID";
import ItemList from "@ext/articleProvider/components/ItemList";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import TemplateService from "@ext/templates/components/TemplateService";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@ui-kit/Button";

interface TemplateTabProps {
	show: boolean;
}

const TemplateTab = ({ show }: TemplateTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID, templates } = TemplateService.value;

	const addNewNote = useCallback(async () => {
		const uniqueID = generateUniqueID();
		await FetchService.fetch(apiUrlCreator.createFileInGramaxDir(uniqueID, "template"));

		const res = await FetchService.fetch<ProviderItemProps[]>(apiUrlCreator.getArticleListInGramaxDir("template"));
		if (!res.ok) return;

		const newTemplates = await res.json();
		TemplateService.setItems(newTemplates);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedID) return;

		const listener = () => {
			TemplateService.closeItem();
		};

		const clickToken = NavigationEvents.on("item-click", listener);
		const createToken = NavigationEvents.on("item-create", listener);
		const deleteToken = NavigationEvents.on("item-delete", listener);

		return () => {
			NavigationEvents.off(clickToken);
			NavigationEvents.off(createToken);
			NavigationEvents.off(deleteToken);
		};
	}, [selectedID]);

	useEffect(() => {
		if (!show) return;

		TemplateService.fetchItems(apiUrlCreator);
	}, [show]);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedID === id) {
				TemplateService.closeItem();
			}

			const newTemplates = Array.from(templates.values()).filter((t) => t.id !== id);
			TemplateService.setItems(newTemplates);
		},
		[selectedID, templates],
	);

	const onMarkdownChange = useCallback(
		(id: string) => {
			if (selectedID === id) {
				TemplateService.closeItem();

				setTimeout(() => {
					TemplateService.openItem(templates.get(id));
				}, 0);
			}
		},
		[selectedID, templates],
	);

	const onItemClick = useCallback(
		(id: string) => {
			const template = templates.get(id);
			if (!template) return;

			TemplateService.openItem(template);
		},
		[templates],
	);

	return (
		<TabWrapper
			ref={tabWrapperRef}
			isTop
			show={show}
			title=""
			contentHeight={height}
			titleRightExtension={
				<Button startIcon="plus" onClick={addNewNote} size="sm" variant="text" className="p-0 h-auto">
					{t("template.new-template")}
				</Button>
			}
		>
			<ItemList
				tabWrapperRef={tabWrapperRef}
				show={show}
				setContentHeight={setHeight}
				noItemsText={t("template.no-templates")}
				items={Array.from(templates.values())}
				selectedItemId={selectedID}
				providerType="template"
				onItemClick={onItemClick}
				onDelete={onDelete}
				onMarkdownChange={onMarkdownChange}
				confirmDeleteText={t("confirm-templates-delete")}
			/>
		</TabWrapper>
	);
};

export default TemplateTab;
