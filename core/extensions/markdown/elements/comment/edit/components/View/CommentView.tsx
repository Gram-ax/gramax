import Tooltip from "@components/Atoms/Tooltip";
import type { CommentBlock } from "@core-ui/CommentBlock";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { Comment } from "@ext/markdown/elements/comment/edit/components/Popover/Comment";
import { confirmCommentClose } from "@ext/markdown/elements/comment/edit/logic/confirmCommentClose";
import GlobalEditorIsEditable from "@ext/markdown/elements/comment/edit/logic/GlobalIsEditable";
import { type Editor, type JSONContent, posToDOMRect, type Range } from "@tiptap/core";
import { isInDropdown } from "@ui-kit/Dropdown";
import { type CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Instance, Props } from "tippy.js";
import { isCommentBlockDirty } from "../../logic/isCommentBlockDirty";
import "tippy.js/animations/shift-away.css";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import t from "@ext/localization/locale/translate";

export type CommentViewProps = {
	commentId: string;
	editor: Editor;
	loadComment: (id: string) => Promise<CommentBlock>;
	saveComment: (id: string, comment: CommentBlock) => void;
	deleteComment: (id: string, positions: Range[]) => void;
};

const CommentView = memo((props: CommentViewProps) => {
	const { editor, commentId, loadComment, saveComment, deleteComment } = props;
	const isReadOnly = !editor.isEditable;
	const [data, setData] = useState<CommentBlock>(null);
	const appendCommentToBody =
		editor.extensionManager.extensions.find((ext) => ext.name === "comment")?.options.appendCommentToBody ?? false;

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
	}, [commentId, onShow]);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;

		const hideComment = () => {
			const instance = instanceRef.current;
			if (isReadOnly || !isCommentBlockDirty(instance)) return instance?.hide();
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
	}, [editor, isReadOnly]);

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
		(commentBlock: CommentBlock, hide: boolean = true) => {
			saveComment(openedCommentIdRef.current, commentBlock);
			flagNoDeleteRef.current = true;

			const instance = instanceRef.current;
			if (hide) {
				instance?.hide();
				return setData(null);
			}

			requestAnimationFrame(() => {
				if (instance?.popperInstance) {
					instance.popperInstance.update();
				}
			});
			setData(commentBlock);
		},
		[saveComment],
	);

	const onDelete = useCallback(async () => {
		ArticleUpdaterService.stopLoadingAfterFocus();
		if (!(await confirm(t("confirm-comment-delete")))) return;
		const positions = editor.storage.comment.positions;
		const commentId = openedCommentIdRef.current;
		if (!commentId) return;

		deleteComment(commentId, positions.get(commentId) || []);
		setData(null);
	}, [deleteComment, editor]);

	const onDeleteAnswer = useCallback(
		(commentBlock: CommentBlock) => {
			saveComment(openedCommentIdRef.current, commentBlock);

			requestAnimationFrame(() => {
				if (instanceRef.current?.popperInstance) {
					instanceRef.current.popperInstance.update();
				}
			});
			setData(commentBlock);
		},
		[saveComment],
	);

	const onCreate = useCallback(
		(commentBlock: CommentBlock) => {
			flagNoDeleteRef.current = true;
			createComment(commentBlock.comment.content);
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
			if (isReadOnly || !isCommentBlockDirty(instanceRef.current)) return instanceRef.current?.hide();
			confirmCommentClose().then((result) => {
				if (result) instanceRef.current?.hide();
			});
		},
		[editor, isReadOnly],
	);

	const onClose = useCallback(() => {
		instanceRef.current?.hide();
	}, []);

	return (
		<div ref={elementRef} style={styles}>
			<Tooltip
				animation="shift-away"
				appendTo={() => (appendCommentToBody ? document.body : editor.view.dom.parentElement)}
				arrow={false}
				content={
					<GlobalEditorIsEditable.Provider value={editor?.isEditable}>
						{data && (
							<Comment
								data={data}
								onAddAnswer={onAddAnswer}
								onClose={onClose}
								onCreate={onCreate}
								onDelete={onDelete}
								onDeleteAnswer={onDeleteAnswer}
								user={pageData.userInfo}
							/>
						)}
					</GlobalEditorIsEditable.Provider>
				}
				customStyle
				distance={4} // Because ui kit modal/dropdown has z-index 50
				duration={[150, 150]}
				getReferenceClientRect={getReferenceClientRect}
				hideInMobile={false}
				interactive
				maxWidth="none"
				onClickOutside={onOutsideClick}
				onHide={onHide}
				onMount={(instance) => {
					instanceRef.current = instance;
				}}
				placement="bottom-start"
				popperOptions={{
					modifiers: [
						{
							name: "preventOverflow",
							options: {
								padding: { left: 8, right: 8, top: 8, bottom: 16 },
								boundary: "viewport",
							},
						},
						{
							name: "flip",
							options: {
								fallbackPlacements: ["top-start", "bottom-start"],
								boundary: "viewport",
							},
						},
					],
				}}
				reference={elementRef}
				sticky={true}
				visible={!!data}
				zIndex={50}
			/>
		</div>
	);
});

export default CommentView;
