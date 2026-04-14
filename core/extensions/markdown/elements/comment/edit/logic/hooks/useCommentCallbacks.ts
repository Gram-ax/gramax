import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { addComment, deleteComment } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import type { Range } from "@tiptap/core";
import { type RefObject, useCallback } from "react";

const useCommentCallbacks = (articlePropsRef: RefObject<ClientArticleProps>) => {
	const pageData = PageDataContextService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const loadComment = useCallback(
		async (id: string) => {
			const url = apiUrlCreator.getComment(id);
			const res = await FetchService.fetch<CommentBlock>(url);
			if (!res.ok) return;

			const comment = await res.json();
			return comment;
		},
		[apiUrlCreator],
	);

	const onMarkAdded = useCallback(
		(id: string) => {
			const editor = EditorService.getEditor();
			if (!editor) return;

			const data = editor.storage.comments?.find((comment) => comment.id === id);
			const user = (data?.comment?.user as UserInfo) || pageData.userInfo;
			addComment(articlePropsRef.current.pathname, user, id);
			if (!data) return;

			const url = apiUrlCreator.updateComment(id);
			void FetchService.fetch(url, JSON.stringify(data.comment));
		},
		[apiUrlCreator, articlePropsRef, pageData.userInfo],
	);

	const onMarkDeleted = useCallback(
		async (id: string, positions: Range[]) => {
			const editor = EditorService.getEditor();
			if (!editor) return;

			const data = await loadComment(id);
			if (data) {
				if (!editor.storage.comments) editor.storage.comments = [];
				editor.storage.comments.push({ id, comment: data });
			}

			const user = (data?.comment?.user as UserInfo) || pageData.userInfo;
			deleteComment(articlePropsRef.current.pathname, user, id);

			if (positions.length) return;
			const url = apiUrlCreator.deleteComment(id);
			await FetchService.fetch(url);
		},
		[apiUrlCreator, loadComment, articlePropsRef, pageData.userInfo],
	);

	return {
		onMarkAdded,
		onMarkDeleted,
	};
};

export default useCommentCallbacks;
