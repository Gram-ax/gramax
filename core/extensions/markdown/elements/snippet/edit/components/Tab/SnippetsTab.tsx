import { TextSize } from "@components/Atoms/Button/Button";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import SnippetsList from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetsList";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { useCallback, useEffect, useRef, useState } from "react";

const ExtensionWrapper = styled.div`
	margin-left: -0.5em;
`;

interface SnippetsTabProps {
	show: boolean;
}

const SnippetsTab = ({ show }: SnippetsTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID, snippets } = SnippetService.value;

	const addNewSnippet = useCallback(async () => {
		await SnippetService.addNewSnippet(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedID) return;

		const listener = () => {
			SnippetService.closeSnippet();
			SnippetUpdateService.updateContent(selectedID, apiUrlCreator);
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
						text={t("new-snippet")}
						style={{ marginLeft: "-8px" }}
						iconCode="plus"
						onClick={addNewSnippet}
					/>
				</ExtensionWrapper>
			}
		>
			<SnippetsList
				show={show}
				snippets={snippets}
				selectedID={selectedID}
				apiUrlCreator={apiUrlCreator}
				tabWrapperRef={tabWrapperRef}
				setHeight={setHeight}
			/>
		</TabWrapper>
	);
};

export default SnippetsTab;
