import Item from "@components/Layouts/LeftNavigationTabs/Item";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import TemplateRightExtensions from "@ext/templates/components/Tab/TemplateRightExtensions";
import TemplateService from "@ext/templates/components/TemplateService";
import { RefObject, useEffect, useRef, useCallback, useMemo } from "react";

interface TemplateListProps {
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	setContentHeight: (height: number) => void;
}

const TemplateList = ({ show, tabWrapperRef, setContentHeight }: TemplateListProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { templates, selectedID } = TemplateService.value;

	const ref = useRef<HTMLDivElement>(null);

	const fetchTemplates = useCallback(async () => {
		await TemplateService.fetchTemplates(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!show) return;
		fetchTemplates();
	}, [show]);

	useEffect(() => {
		if (!ref.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		setContentHeight(calculateTabWrapperHeight(mainElement));
	}, [show, templates?.size]);

	const onItemClick = useCallback(
		(id: string) => {
			const template = templates.get(id);
			if (!template) return;

			TemplateService.openTemplate(template);
		},
		[templates],
	);

	const templateList = useMemo(() => {
		return Array.from(templates.values()).map((template) => (
			<Item
				key={template.id}
				id={template.id}
				title={template.title.length ? template.title : t("article.no-name")}
				isSelected={selectedID === template.id}
				rightActionsWidth="2.5em"
				rightActions={<TemplateRightExtensions template={template} />}
				onItemClick={onItemClick}
			/>
		));
	}, [templates, selectedID, onItemClick]);

	return (
		<div ref={ref}>
			{templates.size ? (
				templateList
			) : (
				<div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>{t("template.no-templates")}</div>
			)}
		</div>
	);
};

export default TemplateList;
