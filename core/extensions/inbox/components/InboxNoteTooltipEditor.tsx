import BoxResizeWrapper from "@components/Atoms/BoxResizeWrapper";
import DragWrapper from "@components/Atoms/DragWrapper";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InboxService from "@ext/inbox/components/InboxService";
import styled from "@emotion/styled";
import SmallEditor from "@ext/inbox/components/Editor/SmallEditor";
import TopBarControllers from "@ext/inbox/components/TopBarControllers";
import InboxUtility from "@ext/inbox/logic/InboxUtility";
import { InboxArticle, InboxPosition, InboxRect } from "@ext/inbox/models/types";
import { useEffect, useRef } from "react";

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

const TooltipContent = ({ note }: TooltipContentProps) => {
	return (
		<TooltipWrapper>
			<TooltipContentWrapper className="tooltip-content">
				<TopBarControllers logicPath={note.logicPath} />
				<SmallEditor content={note.content} logicPath={note.logicPath} path={note.ref.path} />
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
