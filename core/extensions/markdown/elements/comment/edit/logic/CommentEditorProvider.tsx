import FetchService from "@core-ui/ApiServices/FetchService";
import { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import CommentView from "@ext/markdown/elements/comment/edit/components/View/CommentView";
import { createEventEmitter, Event, EventEmitter } from "@core/Event/EventEmitter";
import CommentBlockMark from "@ext/markdown/elements/comment/edit/logic/BlockMark";
import { Editor, Range } from "@tiptap/core";
import { createContext, memo, useCallback, useEffect, useState } from "react";

interface CommentEditorProviderProps {
	editor: Editor;
	children: JSX.Element;
}

export type CommentEditorEvents = Event<"delete", { id: string }> & Event<"update", { id: string }>;

export const CommentEditorEventsContext = createContext<EventEmitter<CommentEditorEvents>>(null);

const CommentEditorProvider = (props: CommentEditorProviderProps): JSX.Element => {
	const { editor, children } = props;
	const [events, setEvents] = useState<EventEmitter<CommentEditorEvents>>(null);

	useEffect(() => {
		const eventEmmiter = createEventEmitter<CommentEditorEvents>();
		setEvents(eventEmmiter);
	}, []);

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
				if (res.ok) events.emit("update", { id });
			});
		},
		[apiUrlCreator, events],
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
					editor={editor}
					loadComment={loadComment}
					saveComment={saveComment}
					deleteComment={deleteComment}
				/>
				{children}
			</CommentEditorEventsContext.Provider>
		</>
	);
};

export default memo(CommentEditorProvider);
