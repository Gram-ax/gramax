import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { getEditorStore, setEditorStore } from "@core-ui/stores/EditorStore";
import { addComment, deleteComment } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import { addReviewItem, deleteReviewItem } from "@ext/review/logic/store/ReviewStore";
import type { CommentReviewListItem } from "@ext/review/models/ReviewList";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import type { JSONContent, Range } from "@tiptap/core";
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

	const onCommentSaved = useCallback(
		(id: string, content: JSONContent[]) => {
			addComment(articlePropsRef.current.pathname, pageData.userInfo, id, articlePropsRef.current.title);

			const item: CommentReviewListItem = {
				id,
				type: "comments",
				pathname: articlePropsRef.current.pathname,
				date: new Date().toISOString(),
				author: {
					email: pageData.userInfo.mail,
					name: pageData.userInfo.name,
				},
				commentBlock: {
					comment: {
						dateTime: new Date().toISOString(),
						user: pageData.userInfo,
						content,
					},
					answers: [],
				},
			};
			addReviewItem(item);
		},
		[articlePropsRef, pageData.userInfo],
	);

	const onMarkAdded = useCallback(
		(id: string) => {
			const editor = getEditorStore().editor;
			if (!editor) return;

			const data = editor.storage.comments?.find((comment) => comment.id === id);
			const user = (data?.comment?.user as UserInfo) || pageData.userInfo;
			addComment(articlePropsRef.current.pathname, user, id, articlePropsRef.current.title);
			setEditorStore({ review: true });
			if (!data) return;

			const url = apiUrlCreator.updateComment(id);
			void FetchService.fetch(url, JSON.stringify(data.comment));
		},
		[apiUrlCreator, articlePropsRef, pageData.userInfo],
	);

	const onMarkDeleted = useCallback(
		async (id: string, positions: Range[]) => {
			const editor = getEditorStore().editor;
			if (!editor) return;

			const data = await loadComment(id);
			if (data) {
				if (!editor.storage.comments) editor.storage.comments = [];
				editor.storage.comments.push({ id, comment: data });
			}

			if (positions.length) return;

			const user = (data?.comment?.user as UserInfo) || pageData.userInfo;
			const url = apiUrlCreator.deleteComment(id);
			const res = await FetchService.fetch(url);
			if (!res.ok) return;

			deleteComment(articlePropsRef.current.pathname, user, id);
			deleteReviewItem(id);
		},
		[apiUrlCreator, loadComment, articlePropsRef, pageData.userInfo],
	);

	return {
		onMarkAdded,
		onMarkDeleted,
		onCommentSaved,
	};
};

export default useCommentCallbacks;
