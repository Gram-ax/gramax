import { INBOX_DIRECTORY } from "@app/config/const";
import ScrollableElement from "@components/Layouts/ScrollableElement";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleDataService from "@core-ui/ContextServices/ArticleData";
import InboxService from "@ext/inbox/components/InboxService";
import Note from "@ext/inbox/components/Note/Note";
import InboxUtility from "@ext/inbox/logic/InboxUtility";
import { InboxArticle, InboxDragDropData } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { getBackendOptions } from "@minoru/react-dnd-treeview";
import { useCallback, useEffect, useMemo, useRef, RefObject } from "react";
import { DndProvider } from "react-dnd";

interface InboxProps {
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	setContentHeight: (height: number) => void;
}

const Inbox = ({ show, setContentHeight, tabWrapperRef }: InboxProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageData = ArticleDataService.value;
	const { selectedPath, notes } = InboxService.value;

	const fetchInbox = useCallback(async () => {
		await InboxService.fetchInbox(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		if (pageData?.articleProps?.logicPath.includes(INBOX_DIRECTORY)) {
			const newPaths = InboxUtility.setSelectedPath(selectedPath, [pageData?.articleProps?.logicPath]);
			InboxService.setSelectedPath(newPaths);
		} else if (selectedPath.length === 0) {
			InboxService.setSelectedPath([]);
		}
	}, [pageData?.articleProps?.logicPath]);

	useEffect(() => {
		if (show) fetchInbox();
	}, [show]);

	const handleDrop = useCallback(
		async ({ draggedLogicPath, droppedLogicPath }: InboxDragDropData) => {
			const url = apiUrlCreator.mergeInboxArticles(draggedLogicPath, droppedLogicPath);
			const res = await FetchService.fetch<InboxArticle>(url);
			if (!res.ok) return;

			const newTargetNote = await res.json();
			if (!newTargetNote) return;

			if (selectedPath.includes(draggedLogicPath)) InboxService.setSelectedPath([droppedLogicPath]);

			const droppedNoteIndex = notes.findIndex((note) => note.logicPath === droppedLogicPath);
			const draggedNoteIndex = notes.findIndex((note) => note.logicPath === draggedLogicPath);

			notes[droppedNoteIndex] = newTargetNote;
			notes.splice(draggedNoteIndex, 1);

			InboxService.closeNote(draggedLogicPath);
			InboxService.closeNote(droppedLogicPath);

			const newPaths = InboxUtility.removeSelectedPath(selectedPath, [draggedLogicPath, droppedLogicPath]);
			InboxService.setSelectedPath(newPaths);

			InboxService.setNotes(notes);
			refreshPage();
		},
		[apiUrlCreator, selectedPath, notes],
	);

	const onItemClick = useCallback(
		(logicPath: string) => {
			if (selectedPath.includes(logicPath)) {
				const newPaths = InboxUtility.removeSelectedPath(selectedPath, logicPath);
				InboxService.setSelectedPath(newPaths);
				InboxService.closeNote(logicPath);
				return;
			}

			const tooltipManager = InboxService.getTooltipManager();
			const unpinnedTooltips = tooltipManager.getUnpinnedTooltips();

			const unpinnedLogicPaths = unpinnedTooltips.map((tooltip) => tooltip.note.logicPath);
			const newPaths = InboxUtility.removeSelectedPath(
				InboxUtility.setSelectedPath(selectedPath, [logicPath]),
				unpinnedLogicPaths,
			);

			unpinnedTooltips.forEach((tooltip) => tooltipManager.removeTooltip(tooltip));
			InboxService.setSelectedPath(newPaths);
		},
		[selectedPath],
	);

	const sortedNotes = useMemo(() => InboxUtility.sortByDate(notes), [notes.length]);

	useEffect(() => {
		if (!ref.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = ref.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild.dataset.qa === "loader";

		if (!mainElement && !isSpinner) return;
		setContentHeight(calculateTabWrapperHeight(mainElement));
	}, [ref.current, tabWrapperRef.current, show, sortedNotes?.length]);

	return (
		<div ref={ref}>
			<ScrollableElement style={{ maxHeight: "40vh" }} dragScrolling={false}>
				<DndProvider backend={ModifiedBackend} options={getBackendOptions()}>
					<div className="tree-root" style={{ height: sortedNotes.length === 0 ? "2em" : "auto" }}>
						{sortedNotes.length === 0 && (
							<div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
								{t("inbox.no-catalog-notes")}
							</div>
						)}
						{sortedNotes.map((note) => (
							<Note
								key={note.fileName}
								article={note}
								handleDrop={handleDrop}
								onItemClick={onItemClick}
								isSelected={selectedPath?.includes(note.logicPath)}
							/>
						))}
					</div>
				</DndProvider>
			</ScrollableElement>
		</div>
	);
};

export default Inbox;
