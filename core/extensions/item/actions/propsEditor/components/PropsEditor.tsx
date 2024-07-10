import { NEW_ARTICLE_REGEX } from "@app/config/const";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Input from "@components/Atoms/Input";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { Router } from "@core/Api/Router";
import { useRouter } from "@core/Api/useRouter";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { uniqueName } from "@core/utils/uniqueName";
import { getHeaderRef } from "@ext/artilce/actions/HeaderEditor";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useLocalize from "../../../../localization/useLocalize";

interface PropsEditorProps {
	item: ClientArticleProps;
	itemLink: ItemLink;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	isCategory: boolean;
	isCurrentItem: boolean;
	brotherFileNames: string[];
}

const PropsEditor = (props: PropsEditorProps) => {
	const { item, itemLink, setItemLink, isCategory, isCurrentItem, brotherFileNames } = props;
	const domain = PageDataContextService.value.domain;
	const articleProps = ArticlePropsService.value;
	const isEdit = IsEditService.value;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [parentCategoryLink, setParentCategoryLink] = useState<string>(domain);

	const [isOpen, setIsOpen] = useState(false);
	const [itemProps, setItemProps] = useState<ClientArticleProps>();

	const [generatedFileName, setGeneratedFileName] = useState<string>();

	useEffect(() => {
		setParentCategoryLink(domain + "/" + item?.logicPath.replace(/[^/]*$/, ""));
		setItemProps(item);
	}, [item]);

	const updateNavigation = (
		isCurrentItem: boolean,
		router: Router,
		logicPath: string,
		articleLogicPath: string,
		itemLogicPath: string,
	) => {
		if (isCurrentItem) return router.pushPath(logicPath);
		if (articleLogicPath.startsWith(itemLogicPath))
			return router.pushPath(articleProps.logicPath.replace(itemProps.logicPath, logicPath));
		return refreshPage();
	};

	const save = async () => {
		if (getErrorText()) return;
		if (generatedFileName) itemProps.fileName = generatedFileName;
		ArticlePropsService.set(itemProps);
		const response = await FetchService.fetch(
			apiUrlCreator.updateItemProps(),
			JSON.stringify(itemProps),
			MimeTypes.json,
		);
		const logicPath = await response.text();
		updateNavigation(isCurrentItem, router, logicPath, articleProps.logicPath, itemProps.logicPath);
		setIsOpen(false);
	};

	if (!isEdit) return null;

	const getErrorText = () => {
		const fileName = generatedFileName ?? itemProps?.fileName;
		if (!fileName) return useLocalize("mustBeNotEmpty");
		if (brotherFileNames?.includes(fileName)) return useLocalize("cantBeSameName");
		if (!/^[\w\d\-_]+$/m.test(fileName)) return useLocalize("noEncodingSymbolsInUrl");
		return null;
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			trigger={<ButtonLink iconCode="pencil" text={useLocalize("configure")} />}
			contentWidth={"S"}
			onCmdEnter={save}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{useLocalize(isCategory ? "сategoryProperties" : "articleProperties")}</legend>
						<label className="control-label">{useLocalize("title")}</label>
						<div className="form-group field field-string">
							<Input
								dataQa={useLocalize("title")}
								isCode
								value={itemProps?.title}
								onChange={(e) => {
									itemProps.title = itemLink.title = e.target.value ?? "";
									if (itemProps.title && NEW_ARTICLE_REGEX.test(itemProps.fileName)) {
										setGeneratedFileName(
											uniqueName(
												transliterate(itemProps.title, { kebab: true, maxLength: 50 }),
												brotherFileNames,
											),
										);
									}
									setItemLink({ ...itemLink });
									setItemProps({ ...itemProps });
									if (isCurrentItem) ArticlePropsService.set(itemProps);

									const hr = getHeaderRef();
									if (hr && isCurrentItem) hr.current.innerText = e.target.value;
								}}
								placeholder="Enter value"
							/>
						</div>
						<label className="control-label">
							{"URL"}
							<span className="required">*</span>
						</label>
						<div className="form-group field field-string">
							<Input
								dataQa="URL"
								isCode
								value={generatedFileName ?? itemProps?.fileName}
								startText={parentCategoryLink}
								endText={"/"}
								errorText={getErrorText()}
								onChange={(e) => {
									setGeneratedFileName(undefined);
									itemProps.fileName = e.target.value ?? "";
									setItemProps({ ...itemProps });
									if (isCurrentItem) ArticlePropsService.set(itemProps);
								}}
								placeholder="Enter value"
							/>
						</div>
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.default} onClick={save} disabled={!!getErrorText()}>
								<span>{useLocalize("save")}</span>
							</Button>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PropsEditor;
