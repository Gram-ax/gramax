import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { setEditorContext } from "@ext/markdown/elementsUtils/editorContext/EditorContext";
import { useSetting } from "@ext/settings/logic/hooks";
import type { Editor } from "@tiptap/core";
import { useLayoutEffect } from "react";

const useEditorContext = (editor: Editor | null): void => {
	const [theme] = useSetting("general.theme");
	const isMac = IsMacService.value;
	const articleProps = ArticlePropsService.value;
	const catalogProps = useCatalogPropsStore((state) => state.data);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;
	const articleRef = ArticleRefService.value;
	const resourceService = ResourceService.value;
	const platform = PlatformService.value;
	const sourceData = SourceDataService.value;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		setEditorContext(editor, {
			theme,
			isMac,
			articleProps,
			catalogProps,
			apiUrlCreator,
			pageDataContext,
			articleRef,
			resourceService,
			platform,
			sourceData,
		});
	}, [
		editor,
		theme,
		isMac,
		articleProps,
		catalogProps,
		apiUrlCreator,
		pageDataContext,
		articleRef,
		resourceService,
		platform,
		sourceData,
	]);
};

export default useEditorContext;
