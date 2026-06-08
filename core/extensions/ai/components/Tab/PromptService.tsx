import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import PromptNoteTooltipEditor from "@ext/ai/components/Tab/PromptNoteTooltipEditor";
import { promptStore } from "@ext/ai/components/Tab/PromptStore";
import { useEffect } from "react";

const PromptServiceProvider = ({ children }: { children: JSX.Element }): JSX.Element => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;
	const catalogProps = useCatalogPropsStore((state) => state.data);

	useEffect(() => {
		promptStore.getState().setContext(pageDataContext, catalogProps);
	}, [pageDataContext, catalogProps]);

	useEffect(() => {
		promptStore.getState().initTooltipManager(apiUrlCreator, PromptNoteTooltipEditor);
		return () => promptStore.getState().destroyTooltipManager();
	}, [apiUrlCreator]);

	return children;
};

export default PromptServiceProvider;
