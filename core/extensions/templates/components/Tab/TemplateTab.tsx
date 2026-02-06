import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import generateUniqueID from "@core/utils/generateUniqueID";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ItemList from "@ext/articleProvider/components/ItemList";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import TemplateService from "@ext/templates/components/TemplateService";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useRef, useState } from "react";

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
			contentHeight={height}
			isTop
			ref={tabWrapperRef}
			show={show}
			title=""
			titleRightExtension={
				<Button className="p-0 h-auto" onClick={addNewNote} size="sm" startIcon="plus" variant="text">
					{t("template.new-template")}
				</Button>
			}
		>
			<ItemList
				confirmDeleteText={t("confirm-templates-delete")}
				items={Array.from(templates.values())}
				noItemsText={t("template.no-templates")}
				onDelete={onDelete}
				onItemClick={onItemClick}
				onMarkdownChange={onMarkdownChange}
				providerType="template"
				selectedItemId={selectedID}
				setContentHeight={setHeight}
				show={show}
				tabWrapperRef={tabWrapperRef}
			/>
		</TabWrapper>
	);
};

export default TemplateTab;
