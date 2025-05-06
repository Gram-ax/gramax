import Tooltip from "@components/Atoms/Tooltip";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import DeleteItem from "@ext/item/actions/DeleteItem";
import ActionWarning, { shouldShowActionWarning } from "@ext/localization/actions/ActionWarning";
import t from "@ext/localization/locale/translate";
import { MouseEvent, useCallback } from "react";
import Path from "@core/FileProvider/Path/Path";
import { TemplateProps } from "@ext/templates/models/types";
import TemplateService from "@ext/templates/components/TemplateService";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import FileEditor from "@ext/artilce/actions/FileEditor";

const Wrapper = styled.div`
	display: flex;
	align-items: center;
`;

const EllipsisMenu = ({ template }: { template: TemplateProps }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const { templates, selectedID } = TemplateService.value;

	const onClickTrigger = (e: MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const onClick = async () => {
		if (!shouldShowActionWarning(catalogProps) && !(await confirm(t("confirm-article-delete")))) return;

		await FetchService.fetch(apiUrlCreator.removeFileInGramaxDir(new Path(template.ref.path).name, "template"));

		if (selectedID === template.id) {
			TemplateService.closeTemplate();
		}

		const newTemplates = Array.from(templates.values()).filter((t) => t.id !== template.id);
		TemplateService.setTemplates(newTemplates);
	};

	return (
		<Tooltip content={t("delete")}>
			<div onClick={onClickTrigger} style={{ paddingLeft: "0.5rem" }}>
				<ActionWarning isDelete catalogProps={catalogProps} action={onClick}>
					<div>
						<DeleteItem text={null} />
					</div>
				</ActionWarning>
			</div>
		</Tooltip>
	);
};

const TemplateRightExtensions = ({ template }: { template: TemplateProps }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID } = TemplateService.value;

	const loadContent = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getFileContentInGramaxDir(template.id, "template"));
		if (res.ok) return await res.json();
	}, [apiUrlCreator, template.id]);

	const saveContent = useCallback(
		async (content: string) => {
			const body = JSON.stringify({ content });
			await FetchService.fetch(apiUrlCreator.updateFileInGramaxDir(template.id, "template"), body);

			if (selectedID === template.id) {
				TemplateService.closeTemplate();

				setTimeout(() => {
					TemplateService.openTemplate(template);
				}, 0);
			}
		},
		[apiUrlCreator, template, selectedID],
	);

	return (
		<Wrapper>
			<Tooltip content={t("article.edit-markdown")}>
				<FileEditor
					trigger={<ButtonLink iconCode="pencil" />}
					loadContent={loadContent}
					saveContent={saveContent}
				/>
			</Tooltip>
			<EllipsisMenu template={template} />
		</Wrapper>
	);
};

export default TemplateRightExtensions;
