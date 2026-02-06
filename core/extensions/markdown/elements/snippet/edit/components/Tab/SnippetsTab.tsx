import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import SnippetsList from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetsList";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useRef, useState } from "react";

interface SnippetsTabProps {
	show: boolean;
}

const SnippetsTab = ({ show }: SnippetsTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID, snippets } = SnippetService.value;
	const router = useRouter();

	const addNewSnippet = useCallback(async () => {
		await SnippetService.addNewSnippet(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedID) return;

		const listener = async ({ path, mutable }: { path: string; mutable: { preventGoto?: boolean } }) => {
			mutable.preventGoto = true;
			await SnippetUpdateService.updateContent(selectedID, apiUrlCreator);
			SnippetService.closeItem();
			router.pushPath(path);
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
			contentHeight={height}
			isTop
			ref={tabWrapperRef}
			show={show}
			title=""
			titleRightExtension={
				<Button className="p-0 h-auto" onClick={addNewSnippet} size="sm" startIcon="plus" variant="text">
					{t("new-snippet")}
				</Button>
			}
		>
			<SnippetsList
				apiUrlCreator={apiUrlCreator}
				selectedID={selectedID}
				setHeight={setHeight}
				show={show}
				snippets={snippets}
				tabWrapperRef={tabWrapperRef}
			/>
		</TabWrapper>
	);
};

export default SnippetsTab;
