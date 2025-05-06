import { TextSize } from "@components/Atoms/Button/Button";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import generateUniqueID from "@core/utils/generateUniqueID";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import TemplateList from "@ext/templates/components/Tab/TemplateList";
import TemplateService from "@ext/templates/components/TemplateService";
import { TemplateProps } from "@ext/templates/models/types";
import { useCallback, useEffect, useRef, useState } from "react";

const ExtensionWrapper = styled.div`
	margin-left: -0.5em;
`;

interface TemplateTabProps {
	show: boolean;
}

const TemplateTab = ({ show }: TemplateTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID } = TemplateService.value;

	const addNewNote = useCallback(async () => {
		const uniqueID = generateUniqueID();
		await FetchService.fetch(apiUrlCreator.createFileInGramaxDir(uniqueID, "template"));

		const res = await FetchService.fetch<TemplateProps[]>(apiUrlCreator.getTemplates());
		if (!res.ok) return;

		const newTemplates = await res.json();
		TemplateService.setTemplates(newTemplates);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedID) return;

		const listener = () => {
			TemplateService.closeTemplate();
			refreshPage();
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

	return (
		<TabWrapper
			ref={tabWrapperRef}
			isTop
			show={show}
			title=""
			contentHeight={height}
			titleRightExtension={
				<ExtensionWrapper>
					<ButtonLink
						textSize={TextSize.S}
						text={t("template.new-template")}
						style={{ marginLeft: "-8px" }}
						iconCode="plus"
						onClick={addNewNote}
					/>
				</ExtensionWrapper>
			}
		>
			<TemplateList tabWrapperRef={tabWrapperRef} show={show} setContentHeight={setHeight} />
		</TabWrapper>
	);
};

export default TemplateTab;
