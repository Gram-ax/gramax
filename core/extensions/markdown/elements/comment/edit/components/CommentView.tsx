import { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Comment from "../components/Comment";
import { Editor, JSONContent, posToDOMRect, Range } from "@tiptap/core";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { CommentBlock } from "@core-ui/CommentBlock";
import GlobalEditorIsEditable from "@ext/markdown/elements/comment/edit/logic/GlobalIsEditable";
import Tooltip from "@components/Atoms/Tooltip";
import { Instance, Props } from "tippy.js";
import { isInDropdown } from "@ui-kit/Dropdown";
import { isCommentBlockDirty } from "../logic/isCommentBlockDirty";
import { confirmCommentClose } from "@ext/markdown/elements/comment/edit/logic/confirmCommentClose";

export type CommentViewProps = {
	commentId: string;
	editor: Editor;
	loadComment: (id: string) => Promise<CommentBlock>;
	saveComment: (id: string, comment: CommentBlock) => void;
	deleteComment: (id: string, positions: Range[]) => void;
};

const CommentView = memo((props: CommentViewProps) => {
	const { editor, commentId, loadComment, saveComment, deleteComment } = props;
	const [data, setData] = useState<CommentBlock>(null);

	const elementRef = useRef<HTMLDivElement>(null);
	const openedCommentIdRef = useRef<string>(null);
	const instanceRef = useRef<Instance<Props>>(null);
	const flagNoDeleteRef = useRef<boolean>(null);

	const pageData = PageDataContext.value;

	const onShow = useCallback(
		async (commentId: string) => {
			const comment = (await loadComment(commentId)) || {};
			setData(comment);
		},
		[loadComment],
	);

	useEffect(() => {
		if (!commentId || commentId === openedCommentIdRef.current) return;
		openedCommentIdRef.current = commentId;
		void onShow(commentId);
	}, [commentId]);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;

		const hideComment = () => {
			const instance = instanceRef.current;
			if (!isCommentBlockDirty(instance)) return instance?.hide();
			confirmCommentClose().then((result) => {
				if (result) instance?.hide();
			});
		};

		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			const openedCommentId = openedCommentIdRef.current;
			if (!openedCommentId) return;

			const { selection, doc } = editor.state;
			const node = doc.nodeAt(selection.anchor);
			if (!node) return hideComment();

			const commentMark = node.marks.find((mark) => mark.type.name === "comment");
			const commentIdAttribute = node.attrs.comment?.id;

			const id = commentMark?.attrs.id || commentIdAttribute;
			if (!id) return hideComment();

			if (openedCommentId === id) return;
			hideComment();
		};

		const onKeyDown = (event: KeyboardEvent) => {
			const instance = instanceRef.current;
			if (event.key === "Escape" && instance?.state.isVisible) hideComment();
		};

		document.addEventListener("keydown", onKeyDown, { capture: true });
		editor.on("selectionUpdate", onSelectionUpdate);

		return () => {
			document.removeEventListener("keydown", onKeyDown, { capture: true });
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor]);

	const onHide = useCallback(() => {
		if (!data?.comment && !flagNoDeleteRef.current) editor.commands.unsetCurrentComment();
		else editor.commands.closeComment();

		flagNoDeleteRef.current = null;

		setData(null);
		openedCommentIdRef.current = null;
	}, [editor, data]);

	const createComment = useCallback(
		(content: JSONContent[]) => {
			const userInfo = pageData.userInfo;
			const newData = {
				comment: {
					dateTime: new Date().toISOString(),
					user: {
						mail: userInfo.mail,
						name: userInfo.name,
					},
					content,
				},
				answers: [],
			};
			saveComment(openedCommentIdRef.current, newData);
			setData(null);

			instanceRef.current?.hide();
		},
		[saveComment, pageData?.userInfo],
	);

	const onAddAnswer = useCallback(
		(commentBlock: CommentBlock) => {
			saveComment(openedCommentIdRef.current, commentBlock);
			flagNoDeleteRef.current = true;
			instanceRef.current?.hide();
		},
		[saveComment],
	);

	const onDelete = useCallback(() => {
		const positions = editor.storage.comment.positions;
		const commentId = openedCommentIdRef.current;
		if (!commentId) return;

		deleteComment(commentId, positions.get(commentId) || []);
		setData(null);
	}, [deleteComment, editor]);

	const onCreate = useCallback(
		(commentBlock: CommentBlock) => {
			saveComment(openedCommentIdRef.current, commentBlock);
			setData(commentBlock);
		},
		[saveComment],
	);

	const onConfirm = useCallback(
		(content: JSONContent[]) => {
			flagNoDeleteRef.current = true;
			createComment(content);
		},
		[createComment],
	);

	const styles = useMemo(() => {
		return {
			visibility: "hidden",
		} as CSSProperties;
	}, []);

	const getReferenceClientRect = useCallback(() => {
		const position = editor.storage?.comment?.openedComment?.position;
		if (!position) return { top: 0, left: 0, width: 0, height: 0 } as DOMRect;
		return posToDOMRect(editor.view, position.from, position.to);
	}, [editor]);

	const onOutsideClick = useCallback(
		(_, event) => {
			const target = event.target as HTMLElement;
			if (editor.view.dom.contains(target) || isInDropdown(event)) return;
			if (!isCommentBlockDirty(instanceRef.current)) return instanceRef.current?.hide();
			confirmCommentClose().then((result) => {
				if (result) instanceRef.current?.hide();
			});
		},
		[editor],
	);

	return (
		<div ref={elementRef} style={styles}>
			<Tooltip
				interactive
				customStyle
				onMount={(instance) => {
					instanceRef.current = instance;
				}}
				arrow={false}
				placement="bottom-start"
				zIndex={50} // Because ui kit modal/dropdown has z-index 50
				distance={4}
				sticky={true}
				visible={!!data}
				appendTo={() => editor.view.dom.parentElement}
				getReferenceClientRect={getReferenceClientRect}
				reference={elementRef}
				onHide={onHide}
				onClickOutside={onOutsideClick}
				content={
					<GlobalEditorIsEditable.Provider value={editor?.isEditable}>
						{data && (
							<Comment
								mark={data}
								view={editor.view}
								onDelete={onDelete}
								onCreate={onCreate}
								onConfirm={onConfirm}
								onAddAnswer={onAddAnswer}
							/>
						)}
					</GlobalEditorIsEditable.Provider>
				}
			/>
		</div>
	);
});

export default CommentView;
