import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import FragmentUpdateService from "@ext/markdown/elements/fragment/edit/components/FragmentUpdateService";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import FragmentsList from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentsList";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useRef, useState } from "react";

interface FragmentsTabProps {
	show: boolean;
}

const FragmentsTab = ({ show }: FragmentsTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID, fragments } = FragmentService.value;
	const router = useRouter();

	const addNewFragment = useCallback(async () => {
		await FragmentService.addNewFragment(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!selectedID) return;

		const listener = async ({ path, mutable }: { path: string; mutable: { preventGoto?: boolean } }) => {
			mutable.preventGoto = true;
			await FragmentUpdateService.updateContent(selectedID, apiUrlCreator);
			FragmentService.closeItem();
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
	}, [selectedID, apiUrlCreator, router.pushPath]);

	return (
		<TabWrapper
			contentHeight={height}
			isTop
			ref={tabWrapperRef}
			show={show}
			title=""
			titleRightExtension={
				<Button className="p-0 h-auto" onClick={addNewFragment} size="sm" startIcon="plus" variant="text">
					{t("new-fragment")}
				</Button>
			}
		>
			<FragmentsList
				apiUrlCreator={apiUrlCreator}
				fragments={fragments}
				selectedID={selectedID}
				setHeight={setHeight}
				show={show}
				tabWrapperRef={tabWrapperRef}
			/>
		</TabWrapper>
	);
};

export default FragmentsTab;
