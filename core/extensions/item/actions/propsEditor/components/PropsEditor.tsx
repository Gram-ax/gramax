import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "../../../../../logic/Api/useRouter";
import { ArticleProps } from "../../../../../logic/SitePresenter/SitePresenter";
import { getHeaderRef } from "../../../../artilce/actions/HeaderEditor";
import useLocalize from "../../../../localization/useLocalize";
import { ItemLink } from "../../../../navigation/NavigationLinks";

const PropsEditor = ({
	item,
	itemLink,
	setItemLink,
	isCategory,
	isCurrentItem,
	brotherFileNames,
}: {
	item: ArticleProps;
	itemLink: ItemLink;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	isCategory: boolean;
	isCurrentItem: boolean;
	brotherFileNames: string[];
}) => {
	const domain = PageDataContextService.value.domain;
	const isEdit = IsEditService.value;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [parentCategoryLink, setParentCategoryLink] = useState<string>(domain);

	const [isOpen, setIsOpen] = useState(false);
	const [itemProps, setItemProps] = useState<ArticleProps>();
	const [isInputInvalid, setIsInputInvalid] = useState<boolean>(false);

	useEffect(() => {
		setParentCategoryLink(domain + "/" + item?.path.replace(/[^/]*$/, ""));
		setItemProps(item);

		setIsInputInvalid(
			!/^[\w\d\-_]+$/m.test(itemProps?.fileName) || brotherFileNames?.includes(itemProps?.fileName),
		);
	}, [item]);

	const save = async () => {
		const response = await FetchService.fetch(
			apiUrlCreator.updateItemProps(),
			JSON.stringify(itemProps),
			MimeTypes.json,
		);
		const data = (await response.json()) as ArticleProps;
		router.pushPath(data.path);
		setIsOpen(false);
	};

	if (!isEdit) return null;

	const errorText = () => {
		if (!itemProps?.fileName) return useLocalize("mustBeNotEmpty");
		if (brotherFileNames?.includes(itemProps?.fileName)) return useLocalize("cantBeSameName");
		if (!/^[\w\d\-_]+$/m.test(itemProps?.fileName)) return useLocalize("noEncodingSymbolsInUrl");
		return null;
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			trigger={
				<div>
					<Icon code="pen" faFw />
					<span>{`${useLocalize("properties")}...`}</span>
				</div>
			}
			contentWidth={"45%"}
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
								isCode
								value={itemProps?.title}
								onChange={(e) => {
									itemProps.title = itemLink.title = e.target.value ?? "";
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
								isCode
								value={itemProps?.fileName}
								startText={parentCategoryLink}
								endText={"/"}
								isInputInvalid={isInputInvalid}
								errorText={errorText()}
								onChange={(e) => {
									const inputValue = e.target.value ?? "";

									setIsInputInvalid(
										!inputValue ||
											!/^[\w\d\-_]+$/m.test(inputValue) ||
											brotherFileNames?.includes(inputValue),
									);

									itemProps.fileName = inputValue;
									setItemProps({ ...itemProps });
									if (isCurrentItem) ArticlePropsService.set(itemProps);
								}}
								placeholder="Enter value"
							/>
						</div>
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.default} onClick={save} disabled={isInputInvalid}>
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
