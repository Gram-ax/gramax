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
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { Router } from "@core/Api/Router";
import { useRouter } from "@core/Api/useRouter";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { uniqueName } from "@core/utils/uniqueName";
import ActionWarning from "@ext/localization/actions/ActionWarning";
import t from "@ext/localization/locale/translate";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
	const catalogProps = CatalogPropsService.value;
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
		ArticlePropsService.set({ ...itemProps });
		const response = await FetchService.fetch(
			apiUrlCreator.updateItemProps(),
			JSON.stringify(itemProps),
			MimeTypes.json,
		);
		const logicPath = await response.text();
		updateNavigation(isCurrentItem, router, logicPath, articleProps.logicPath, itemProps.logicPath);
		const editor = EditorService.getEditor();
		itemLink.title = itemProps.title;
		setItemLink({ ...itemLink });

		if (editor) {
			const hr = editor.view.dom.firstChild as HTMLHeadingElement;
			if (hr && isCurrentItem) hr.innerText = itemProps.title;
		}

		setIsOpen(false);
	};

	if (!isEdit) return null;

	const getErrorText = () => {
		const fileName = generatedFileName ?? itemProps?.fileName;
		if (!fileName) return t("must-be-not-empty");
		if (brotherFileNames?.includes(fileName)) return t("cant-be-same-name");
		if (!/^[\w\d\-_]+$/m.test(fileName)) return t("no-encoding-symbols-in-url");
		return null;
	};

	const onClose = () => {
		setItemProps({ ...item });
		setIsOpen(false);
	};

	const isOnlyTitleChanged =
		itemProps &&
		Object.keys(itemProps).every((key) => {
			if (key === "title") return itemProps.title !== item.title;
			return itemProps[key] === item[key];
		});

	return (
		<ModalLayout
			closeOnCmdEnter
			isOpen={isOpen}
			trigger={<ButtonLink iconCode="pencil" text={t("configure")} />}
			contentWidth={"S"}
			onOpen={() => setIsOpen(true)}
			onClose={onClose}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{isCategory ? t("category.configure") : t("article.configure")}</legend>
						<fieldset>
							<label className="control-label">{t("title")}</label>
							<div className="form-group field field-string">
								<Input
									dataQa={t("title")}
									isCode
									value={itemProps?.title}
									onChange={(e) => {
										const newItemProps = { ...itemProps };
										newItemProps.title = e.target.value ?? "";
										if (newItemProps.title && NEW_ARTICLE_REGEX.test(newItemProps.fileName)) {
											setGeneratedFileName(
												uniqueName(
													transliterate(newItemProps.title, { kebab: true, maxLength: 50 }),
													brotherFileNames,
												),
											);
										}
										setItemProps({ ...newItemProps });
									}}
									placeholder={t("enter-value")}
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
										const newItemProps = { ...itemProps };
										setGeneratedFileName(undefined);
										newItemProps.fileName = e.target.value ?? "";
										setItemProps({ ...newItemProps });
									}}
									placeholder={t("enter-value")}
								/>
							</div>
							<div className="buttons">
								{!isOnlyTitleChanged ? (
									<ActionWarning catalogProps={catalogProps} action={save}>
										<Button buttonStyle={ButtonStyle.default} disabled={!!getErrorText()}>
											<span>{t("save")}</span>
										</Button>
									</ActionWarning>
								) : (
									<Button
										buttonStyle={ButtonStyle.default}
										onClick={save}
										disabled={!!getErrorText()}
									>
										<span>{t("save")}</span>
									</Button>
								)}
							</div>
						</fieldset>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PropsEditor;
