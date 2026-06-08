import { createEventEmitter, type Event, type EventEmitter } from "@core/Event/EventEmitter";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import CommentView from "@ext/markdown/elements/comment/edit/components/View/CommentView";
import CommentBlockMark from "@ext/markdown/elements/comment/edit/logic/BlockMark";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import { scrollToReviewItem } from "@ext/review/logic/utils/scrollToReviewItem";
import type { Editor, JSONContent, Range } from "@tiptap/core";
import { createContext, memo, useCallback, useEffect, useState } from "react";

interface CommentEditorProviderProps {
	editor: Editor;
	children: JSX.Element;
	onCommentSaved?: (id: string, content: JSONContent[]) => void;
}

export type CommentEditorEvents = Event<"delete", { id: string }> & Event<"update", { id: string }>;

export const CommentEditorEventsContext = createContext<EventEmitter<CommentEditorEvents>>(null);

const CommentEditorProvider = (props: CommentEditorProviderProps): JSX.Element => {
	const { editor, children, onCommentSaved } = props;
	const [events, setEvents] = useState<EventEmitter<CommentEditorEvents>>(null);
	const articleRef = ArticleRefService.value;
	const { pendingItem, setPendingItem } = useReviewStore((s) => ({
		pendingItem: s.pendingItem,
		setPendingItem: s.setPendingItem,
	}));

	useEffect(() => {
		const eventEmmiter = createEventEmitter<CommentEditorEvents>();
		setEvents(eventEmmiter);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		editor.once("create", () => {
			if (!pendingItem) return;

			if (!articleRef.current) return;
			scrollToReviewItem(articleRef.current, pendingItem, editor);
			setPendingItem(null);
		});
	}, [editor, articleRef]);

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

	const saveComment = useCallback(
		(id: string, comment: CommentBlock) => {
			const url = apiUrlCreator.updateComment(id);
			FetchService.fetch(url, JSON.stringify(comment)).then((res) => {
				if (!res.ok) return;
				events.emit("update", { id });
				onCommentSaved?.(id, comment.comment.content);
			});
		},
		[apiUrlCreator, events, onCommentSaved],
	);

	const deleteComment = useCallback(
		(id: string, positions: Range[]) => {
			const blockMark = new CommentBlockMark(editor.state.tr, editor.schema.marks.comment);
			const tr = blockMark.deleteMarkup(positions);
			editor.view.dispatch(tr);
			events.emit("delete", { id });
		},
		[editor, events],
	);

	return (
		<>
			<CommentEditorEventsContext.Provider value={events}>
				<CommentView
					commentId={editor.storage?.comment?.openedComment?.id}
					deleteComment={deleteComment}
					editor={editor}
					loadComment={loadComment}
					saveComment={saveComment}
				/>
				{children}
			</CommentEditorEventsContext.Provider>
		</>
	);
};

export default memo(CommentEditorProvider);
