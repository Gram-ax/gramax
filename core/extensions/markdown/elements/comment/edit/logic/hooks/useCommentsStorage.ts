import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import type { Editor } from "@tiptap/core";
import { useCallback, useEffect } from "react";

const useCommentsStorage = (editor: Editor) => {
	const apiUrlCreator = ApiUrlCreator.value;

	// biome-ignore lint/correctness/useExhaustiveDependencies: apiUrlCreator is a context service, but it does change with the article — reload when it does
	const load = useCallback(async () => {
		if (!editor || editor.isDestroyed) return;

		const res = await FetchService.fetch<Record<string, CommentBlock>>(
			apiUrlCreator.getAllComments(),
			undefined,
			undefined,
			undefined,
			false,
		);
		if (!res.ok || editor.isDestroyed) return;

		const comments = await res.json();
		editor.storage.comment.comments = new Map(Object.entries(comments ?? {}));
		editor.storage.comment.deleted = new Map();
	}, [editor, apiUrlCreator]);

	useEffect(() => {
		void load();

		const unsubscribe = ArticleUpdaterService.onUpdated(load);
		return () => {
			unsubscribe();
		};
	}, [load]);
};

export default useCommentsStorage;
