import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { TemplateContentWarningProps } from "@ext/templates/components/TemplateContentWarning";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import DropdownButton from "@ext/wordExport/components/DropdownButton";
import { useRef, useState } from "react";

const Loader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 8em !important;
`;

const TemplateItemList = ({ itemRefPath }: { itemRefPath: string }) => {
	const [list, setList] = useState<ProviderItemProps[]>([]);
	const [isApiRequest, setIsApiRequest] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

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

	const onClickHandler = async (item: ProviderItemProps) => {
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
		? [...Array(3)].map((_, index) => (
				<Loader key={index}>
					<ButtonLink text={t("loading")} />
					<SpinnerLoader width={14} height={14} />
				</Loader>
		  ))
		: list.map((item) => (
				<ButtonLink
					key={item.id}
					text={item.title.length ? item.title : t("article.no-name")}
					onClick={() => onClickHandler(item)}
				/>
		  ));

	return (
		<PopupMenuLayout
			appendTo={() => ref.current}
			offset={[10, -5]}
			className="wrapper"
			placement="right-start"
			openTrigger="mouseenter focus"
			onOpen={() => {
				fetchTemplateItems();
			}}
			trigger={<DropdownButton ref={ref} iconCode="layout-template" text={t("template.choose-template")} />}
		>
			{items.length ? items : <ButtonLink text={t("template.no-templates")} />}
		</PopupMenuLayout>
	);
};

export default TemplateItemList;
