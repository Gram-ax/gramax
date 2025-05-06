import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import BoxResizeWrapper from "@components/Atoms/BoxResizeWrapper";
import DragWrapper from "@components/Atoms/DragWrapper";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import SmallEditor from "@ext/inbox/components/Editor/SmallEditor";
import InboxService from "@ext/inbox/components/InboxService";
import TopBarControllers from "@ext/inbox/components/TopBarControllers";
import InboxUtility from "@ext/inbox/logic/InboxUtility";
import { InboxArticle, InboxPosition, InboxRect } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import Document from "@tiptap/extension-document";
import { Extensions, JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";

interface InboxNoteTooltipEditorProps {
	notes: InboxArticle[];
	selectedPath: string[];
	note: InboxArticle;
	apiUrlCreator: ApiUrlCreator;
	tooltipPosition: InboxPosition;
	inboxRect: InboxRect;
	isPinned: boolean;
	setIsPinned: (isPinned: boolean) => void;
	updateRect: (rect: Partial<InboxRect>) => void;
}

type InboxProps = {
	title: string;
	content: JSONContent;
	date: string;
	author: string;
};

interface TooltipContentProps {
	note: InboxArticle;
}

const TooltipWrapper = styled.div`
	max-width: inherit;
	max-height: inherit;
	overflow: hidden;
	height: 100%;
	width: 100%;
`;

const TooltipContentWrapper = styled.div`
	max-width: inherit;
	max-height: inherit;
	padding: 10px;
	padding-top: 0.3rem;
	height: 100%;
	width: 100%;
	font-size: 0.85rem;
	overflow: hidden;
	overflow-y: auto;
	scrollbar-gutter: stable;
`;

const ContainerWrapper = styled.div`
	position: fixed;
	z-index: var(--z-index-popover);
	border-radius: var(--radius-large);
	background: var(--color-article-bg);
	box-shadow: var(--menu-tooltip-shadow) !important;
	width: 30rem;
	max-height: min(45rem, 60vh);
`;

const getInboxExtensions = (): Extensions => [
	...getExtensions(),
	Document.extend({
		content: "paragraph block+",
	}),
	Placeholder.configure({
		placeholder: ({ editor, node }) => {
			if (editor.state.doc.firstChild.type.name === "paragraph" && editor.state.doc.firstChild === node)
				return t("inbox.placeholders.title");

			if (
				node.type.name === "paragraph" &&
				editor.state.doc.content.child(1) === node &&
				editor.state.doc.content.childCount === 2
			)
				return t("inbox.placeholders.content");
		},
	}),
];

const TooltipContent = ({ note }: TooltipContentProps) => {
	const { notes, selectedPath } = InboxService.value;
	const props: InboxProps = {
		title: note.title,
		content: note.content,
		date: note.props.date,
		author: note.props.author,
	};

	const updateCallback = useCallback(
		(id: string, content: JSONContent, title: string) => {
			if (!selectedPath.includes(id)) return;
			const selectedNote = notes.find((note) => note.logicPath === id);
			if (!selectedNote) return;

			if (selectedNote.title !== title) {
				selectedNote.title = title;
			}

			selectedNote.content.content.shift();
			selectedNote.content = getArticleWithTitle(title, content);

			const newNotes = [...notes.filter((note) => note.logicPath !== id), selectedNote];
			InboxService.setNotes(newNotes);
		},
		[notes],
	);

	return (
		<TooltipWrapper>
			<TooltipContentWrapper className="tooltip-content">
				<TopBarControllers logicPath={note.logicPath} />
				<MinimizedArticleStyled>
					<SmallEditor
						props={props}
						content={note.content}
						id={note.logicPath}
						path={note.ref.path}
						extensions={getInboxExtensions()}
						updateCallback={updateCallback}
						articleType="inbox"
					/>
				</MinimizedArticleStyled>
			</TooltipContentWrapper>
		</TooltipWrapper>
	);
};

const InboxNoteTooltipEditor = (props: InboxNoteTooltipEditorProps) => {
	const {
		note,
		apiUrlCreator,
		tooltipPosition,
		inboxRect,
		updateRect,
		setIsPinned,
		isPinned,
		notes,
		selectedPath: initialSelectedPath,
	} = props;
	const resizeRef = useRef(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const newX = inboxRect?.x ?? tooltipPosition.x;
	const newY = inboxRect?.y ?? tooltipPosition.y;
	const newWidth = inboxRect?.width ? `${inboxRect.width}px` : undefined;
	const newHeight = inboxRect?.height ? `${inboxRect.height}px` : undefined;
	const { selectedPath } = InboxService.value;

	const onDragEnd = () => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const x = parseInt(wrapper.style.left);
		const y = parseInt(wrapper.style.top);
		setIsPinned(true);

		updateRect({ x, y, width: inboxRect?.width, height: inboxRect?.height });
	};

	const onResizeStart = () => {
		resizeRef.current = true;
	};

	const onResizeEnd = () => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const x = inboxRect?.x && parseInt(wrapper.style.left);
		const y = inboxRect?.y && parseInt(wrapper.style.top);
		const width = wrapper.clientWidth;
		const height = wrapper.clientHeight;

		resizeRef.current = false;

		updateRect({ x, y, width, height });
	};

	useEffect(() => {
		if (isPinned) return;

		const handleClickOutside = (event) => {
			event.stopPropagation();
			event.preventDefault();
			const isOutside = wrapperRef.current && !wrapperRef.current.contains(event.target);

			if (isOutside && !resizeRef.current) {
				const newPaths = InboxUtility.removeSelectedPath(selectedPath, note.logicPath);
				InboxService.setSelectedPath(newPaths);
				InboxService.closeNote(note.logicPath);
			}
		};

		document.addEventListener("click", handleClickOutside);

		return () => document.removeEventListener("click", handleClickOutside);
	}, [wrapperRef.current, isPinned]);

	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator}>
			<InboxService.Context value={{ notes, selectedPath: initialSelectedPath }}>
				<ContainerWrapper
					ref={wrapperRef}
					style={{
						left: newX,
						top: newY,
						width: newWidth,
						height: newHeight,
						maxWidth: newWidth,
						maxHeight: newHeight,
					}}
				>
					<DragWrapper ref={wrapperRef} onDragEnd={onDragEnd}>
						<BoxResizeWrapper
							ref={wrapperRef}
							maxWidth={window.innerWidth * 0.5}
							maxHeight={window.innerHeight * 0.8}
							minWidth={window.innerWidth * 0.1}
							minHeight={window.innerHeight * 0.06}
							onResizeStart={onResizeStart}
							onResizeEnd={onResizeEnd}
						>
							<TooltipContent note={note} />
						</BoxResizeWrapper>
					</DragWrapper>
				</ContainerWrapper>
			</InboxService.Context>
		</ApiUrlCreatorService.Provider>
	);
};

export default InboxNoteTooltipEditor;
