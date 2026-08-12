import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { getEditorStore, setEditorStore } from "@core-ui/stores/EditorStore";
import { addComment, deleteComment } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import { addReviewItem, deleteReviewItem } from "@ext/review/logic/store/ReviewStore";
import { resolveCommentDOMSelector } from "@ext/review/logic/utils/resolveCommentDOMSelector";
import type { CommentReviewListItem } from "@ext/review/models/ReviewList";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import type { Range } from "@tiptap/core";
import { type RefObject, useCallback } from "react";

const useCommentCallbacks = (articlePropsRef: RefObject<ClientArticleProps>) => {
	const pageData = PageDataContextService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const loadComment = useCallback(async (id: string) => {
		const url = apiUrlCreator.getComment(id);
		const res = await FetchService.fetch<CommentBlock>(url);
		if (!res.ok) return;

		const comment = await res.json();
		return comment;
	}, []);

	const toReviewItem = useCallback(
		(id: string, comment: CommentBlock): CommentReviewListItem => ({
			id,
			type: "comments",
			pathname: articlePropsRef.current.pathname,
			selector: resolveCommentDOMSelector(id),
			date: comment?.comment?.dateTime ?? new Date().toISOString(),
			author: {
				email: comment?.comment?.user?.mail ?? pageData.userInfo.mail,
				name: comment?.comment?.user?.name ?? pageData.userInfo.name,
			},
			commentBlock: comment,
		}),
		[articlePropsRef],
	);

	const onCommentSaved = useCallback(
		(id: string, comment: CommentBlock) => {
			addComment(articlePropsRef.current.pathname, pageData.userInfo, id, articlePropsRef.current.title);
			addReviewItem(toReviewItem(id, comment));
		},
		[articlePropsRef, toReviewItem],
	);

	const onMarkAdded = useCallback(
		async (id: string) => {
			const editor = getEditorStore().editor;
			if (!editor) return;

			const storage = editor.storage.comment;
			if (storage.comments.has(id)) return;

			setEditorStore({ review: true });
			const data: CommentBlock = storage.deleted.get(id);
			if (!data) return;

			storage.comments.set(id, data);
			storage.deleted.delete(id);

			await FetchService.fetch(apiUrlCreator.updateComment(id), JSON.stringify(data));

			addComment(
				articlePropsRef.current.pathname,
				data.comment.user as UserInfo,
				id,
				articlePropsRef.current.title,
			);
			addReviewItem(toReviewItem(id, data));
		},
		[articlePropsRef, toReviewItem],
	);

	const onMarkDeleted = useCallback(
		async (id: string, positions: Range[]) => {
			const editor = getEditorStore().editor;
			if (!editor) return;

			const storage = editor.storage.comment;
			const data: CommentBlock = storage.comments.get(id) ?? (await loadComment(id));
			if (data) {
				storage.deleted.set(id, data);
				storage.comments.delete(id);
			}

			if (positions.length) return;

			const user = (data?.comment?.user as UserInfo) || pageData.userInfo;
			const url = apiUrlCreator.deleteComment(id);
			const res = await FetchService.fetch(url);
			if (!res.ok) return;

			deleteComment(articlePropsRef.current.pathname, user, id);
			deleteReviewItem(id);
		},
		[loadComment, articlePropsRef],
	);

	return {
		onMarkAdded,
		onMarkDeleted,
		onCommentSaved,
	};
};

export default useCommentCallbacks;
