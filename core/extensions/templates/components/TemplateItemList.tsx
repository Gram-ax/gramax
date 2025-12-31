import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { TemplateContentWarningProps } from "@ext/templates/components/TemplateContentWarning";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { useCallback, useState } from "react";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import TemplateService from "@ext/templates/components/TemplateService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { useApi } from "@core-ui/hooks/useApi";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import Icon from "@components/Atoms/Icon";

const TemplateItemList = ({ itemRefPath, disabled }: { itemRefPath: string; disabled: boolean }) => {
	const [list, setList] = useState<ProviderItemProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState(false);

	const { call: fetchTemplateItems } = useApi<ProviderItemProps[]>({
		url: (api) => api.getArticleListInGramaxDir("template"),
		onStart: () => {
			setIsApiRequest(true);
		},
		onDone: (data) => {
			setList(data);
		},
		onFinally: () => {
			setIsApiRequest(false);
		},
	});

	const { call: getArticleContent } = useApi<string>({
		url: (api) => api.getArticleContent(itemRefPath),
	});

	const { call: getItemProps } = useApi<ClientArticleProps>({
		url: (api) => api.getItemProps(itemRefPath),
	});

	const apiUrlCreator = ApiUrlCreatorService.value;

	const setModalLoader = useCallback(() => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
	}, []);

	const setAsTemplate = useCallback(
		async (item: ProviderItemProps) => {
			setModalLoader();
			const itemProps = await getItemProps();
			if (!itemProps) return ModalToOpenService.resetValue();

			itemProps.template = item.id;
			itemProps.title = itemProps.title !== t("article.no-name") ? itemProps.title : "";

			const setArticleContentUrl = apiUrlCreator.setArticleContent(itemRefPath);
			await FetchService.fetch(setArticleContentUrl, "");

			const url = apiUrlCreator.updateItemProps();
			await FetchService.fetch(url, JSON.stringify(itemProps), MimeTypes.json);

			ModalToOpenService.resetValue();
			await refreshPage();
		},
		[itemRefPath, apiUrlCreator, getItemProps],
	);

	const onSelectHandler = useCallback(
		async (item: ProviderItemProps) => {
			setModalLoader();

			const content = await getArticleContent();
			const isHasContent = content?.length > 0;

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
		},
		[getArticleContent],
	);

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

	const onOpen = useCallback(
		(open: boolean) => {
			if (open) fetchTemplateItems();
			else {
				setList([]);
				setIsApiRequest(true);
			}
		},
		[fetchTemplateItems],
	);

	const onNewTemplate = useCallback(async () => {
		NavigationTabsService.setTop(LeftNavigationTab.Template);
		const newTemplate = await TemplateService.addNewSnippet(apiUrlCreator);
		TemplateService.openItem(newTemplate);
	}, [apiUrlCreator]);

	return (
		<DropdownMenuSub onOpenChange={onOpen}>
			<DropdownMenuSubTrigger disabled={disabled}>
				<Icon code="layout-template" />
				{t("template.choose-template")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{items.length ? items : <DropdownMenuItem disabled>{t("template.no-templates")}</DropdownMenuItem>}
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={onNewTemplate}>
					<Icon code="plus" />
					{t("template.new-template")}
				</DropdownMenuItem>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default TemplateItemList;
