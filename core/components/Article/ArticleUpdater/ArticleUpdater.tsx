import type { EditArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { useItemLinksStore } from "@core-ui/stores/ItemLinksStore/ItemLinksStore.provider";
import { useCallback, useEffect } from "react";
import ArticleUpdaterService from "./ArticleUpdaterService";
import { isUnchangedContent } from "./isUnchangedContent";
import parseArticleContent from "./parseArticleContent";

const ArticleUpdater = ({ children }: { children: JSX.Element }) => {
	const { isTauri } = usePlatform();
	const resourceService = ResourceService.value;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	const updateArticleProps = useArticlePropsStore((state) => state.update);
	const setItemLinks = useItemLinksStore((state) => state.setItemLinks);
	const onUpdate = useCallback(
		(newData: EditArticlePageData) => {
			if (!newData || typeof newData.content !== "string") return;
			updateArticleProps({ ...newData.articleProps });
			if (newData.itemLinks) setItemLinks(newData.itemLinks);
			resourceService.clear();
			const editor = getEditorStore().editor;
			if (!editor || editor.isDestroyed) return;
			const parsed = parseArticleContent(newData.content);
			if (!parsed) return;
			// Skip the focus-resetting setContent when nothing actually changed — backstop
			// against a self-write echo that reaches the active article (structural files like
			// _index.md are exempt from watcher self-write suppression, so editing a section
			// landing article echoes back here; a genuine external edit yields a different doc
			// and still applies).
			if (isUnchangedContent(editor, parsed)) return;
			// Clear history to avoid nodes with resources don't be error on undo/redo
			editor.chain().clearHistory().setContent(parsed).run();
		},
		[updateArticleProps, setItemLinks],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	useEffect(() => {
		ArticleUpdaterService.bindOnUpdate(onUpdate);
	}, []);

	if (isReadOnly || !isTauri) return children;

	return children;
};

export default ArticleUpdater;
