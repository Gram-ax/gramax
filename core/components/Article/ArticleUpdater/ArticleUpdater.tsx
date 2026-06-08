import type { EditArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { useCallback, useEffect } from "react";
import ArticleUpdaterService from "./ArticleUpdaterService";

const ArticleUpdater = ({ children }: { children: JSX.Element }) => {
	const { isTauri } = usePlatform();
	const resourceService = ResourceService.value;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	const updateArticleProps = useArticlePropsStore((state) => state.update);
	const onUpdate = useCallback(
		(newData: EditArticlePageData) => {
			updateArticleProps({ ...newData.articleProps });
			resourceService.clear();
			const editor = getEditorStore().editor;
			// Clear history to avoid nodes with resources don't be error on undo/redo
			if (editor) editor.chain().clearHistory().setContent(JSON.parse(newData.content)).run();
		},
		[resourceService?.clear, updateArticleProps],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	useEffect(() => {
		ArticleUpdaterService.bindOnUpdate(onUpdate);
	}, []);

	if (isReadOnly || !isTauri) return children;

	return children;
};

export default ArticleUpdater;
