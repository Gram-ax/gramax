import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { TemplateContentWarningProps } from "@ext/templates/components/TemplateContentWarning";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { useState } from "react";
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";

const TemplateItemList = ({ itemRefPath }: { itemRefPath: string }) => {
	const [list, setList] = useState<ProviderItemProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState(false);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchTemplateItems = async () => {
		setIsApiRequest(true);
		const url = apiUrlCreator.getArticleListInGramaxDir("template");
		const res = await FetchService.fetch<ProviderItemProps[]>(url);

		if (!res.ok) return setIsApiRequest(false);
		const templates = await res.json();

		setList(templates);
		setIsApiRequest(false);
	};

	const setModalLoader = () => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
	};

	const setAsTemplate = async (item: ProviderItemProps) => {
		setModalLoader();
		const itemProps = apiUrlCreator.getItemProps(itemRefPath);
		const res = await FetchService.fetch(itemProps);
		const itemPropsData = await res.json();
		if (!res.ok) return ModalToOpenService.resetValue();

		itemPropsData.template = item.id;
		itemPropsData.title = itemPropsData.title !== t("article.no-name") ? itemPropsData.title : "";

		const setArticleContentUrl = apiUrlCreator.setArticleContent(itemRefPath);
		await FetchService.fetch(setArticleContentUrl, "");

		const url = apiUrlCreator.updateItemProps();
		await FetchService.fetch(url, JSON.stringify(itemPropsData), MimeTypes.json);

		ModalToOpenService.resetValue();
		await refreshPage();
	};

	const onSelectHandler = async (item: ProviderItemProps) => {
		setModalLoader();

		const url = apiUrlCreator.getArticleContent(itemRefPath);
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const content = await res.json();
		const isHasContent = content.length > 0;

		ModalToOpenService.resetValue();
		if (isHasContent) {
			ModalToOpenService.setValue<TemplateContentWarningProps>(ModalToOpen.TemplateContentWarning, {
				initialIsOpen: true,
				templateName: item.title,
				action: () => {
					setAsTemplate(item);
				},
				onClose: () => {
					ModalToOpenService.resetValue();
				},
			});
		} else {
			setAsTemplate(item);
		}
	};

	const items = isApiRequest
		? [
				<DropdownMenuItem key={0} disabled>
					<SpinnerLoader width={14} height={14} />
					{t("loading")}
				</DropdownMenuItem>,
		  ]
		: list.map((item) => (
				<DropdownMenuItem key={item.id} onSelect={() => onSelectHandler(item)}>
					{item.title.length ? item.title : t("article.no-name")}
				</DropdownMenuItem>
		  ));

	const onOpen = (open: boolean) => {
		if (open) fetchTemplateItems();
		else {
			setList([]);
			setIsApiRequest(true);
		}
	};

	return (
		<DropdownMenuSub onOpenChange={onOpen}>
			<DropdownMenuSubTrigger>
				<Icon code="layout-template" />
				{t("template.choose-template")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{items.length ? items : <DropdownMenuItem disabled>{t("template.no-templates")}</DropdownMenuItem>}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default TemplateItemList;
