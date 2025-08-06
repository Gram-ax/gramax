import ScrollableElement from "@components/Layouts/ScrollableElement";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InboxService from "@ext/inbox/components/InboxService";
import Note from "@ext/inbox/components/Note/Note";
import PopoverUtility from "@ext/articleProvider/logic/PopoverUtility";
import { InboxArticle, InboxDragDropData } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import ModifiedBackend, { useDragDrop } from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
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
	const { selectedIds, items } = InboxService.value;

	const { backend, options } = useDragDrop();

	const handleDrop = useCallback(
		async ({ draggedId, droppedId }: InboxDragDropData) => {
			const url = apiUrlCreator.mergeInboxArticles(draggedId, droppedId);
			const res = await FetchService.fetch<InboxArticle>(url);
			if (!res.ok) return;

			const newTargetNote = await res.json();
			if (!newTargetNote) return;

			if (selectedIds.includes(draggedId)) InboxService.setSelectedIds([droppedId]);

			const droppedNoteIndex = items.findIndex((note) => note.id === droppedId);
			const draggedNoteIndex = items.findIndex((note) => note.id === draggedId);

			items[droppedNoteIndex] = newTargetNote;
			items.splice(draggedNoteIndex, 1);

			InboxService.closeNote(draggedId);
			InboxService.closeNote(droppedId);

			const newPaths = PopoverUtility.removeSelectedIds(selectedIds, [draggedId, droppedId]);
			InboxService.setSelectedIds(newPaths);

			InboxService.setItems(items);
			refreshPage();
		},
		[apiUrlCreator, selectedIds, items],
	);

	const onItemClick = useCallback(
		(id: string, target: HTMLElement) => {
			if (selectedIds.includes(id)) {
				const newPaths = PopoverUtility.removeSelectedIds(selectedIds, id);
				InboxService.setSelectedIds(newPaths);
				InboxService.closeNote(id);
				return;
			}

			const tooltipManager = InboxService.getTooltipManager();
			const unpinnedTooltips = tooltipManager.getUnpinnedTooltips();

			const unpinnedIds = unpinnedTooltips.map((tooltip) => tooltip.item.id);
			const newPaths = PopoverUtility.removeSelectedIds(
				PopoverUtility.setSelectedIds(selectedIds, [id]),
				unpinnedIds,
			);

			unpinnedTooltips.forEach((tooltip) => tooltipManager.removeTooltip(tooltip));
			InboxService.setSelectedIds(newPaths);

			const note = items.find((item) => item.id === id);
			if (!note) return;

			InboxService.openNote(note, target);
		},
		[items, selectedIds],
	);

	const sortedNotes = useMemo(() => PopoverUtility.sortByDate(items), [items]);

	useEffect(() => {
		if (!ref.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = ref.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild.dataset.qa === "loader";

		if (!mainElement && !isSpinner) return;
		setContentHeight(calculateTabWrapperHeight(mainElement));
	}, [ref.current, tabWrapperRef.current, show, sortedNotes?.length]);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedIds.includes(id)) {
				InboxService.closeNote(id);
				InboxService.setSelectedIds(PopoverUtility.removeSelectedIds(selectedIds, id));
			}

			const newItems = items.filter((note) => note.id !== id);
			InboxService.setItems(newItems);
		},
		[selectedIds, items],
	);

	if (!show) return null;

	return (
		<div ref={ref}>
			<ScrollableElement style={{ maxHeight: "40vh" }} dragScrolling={false}>
				<DndProvider backend={(manager) => ModifiedBackend(backend(manager))} options={options}>
					<div className="tree-root" style={{ height: sortedNotes.length === 0 ? "2em" : "auto" }}>
						{sortedNotes.length === 0 && (
							<div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
								{t("inbox.no-catalog-notes")}
							</div>
						)}
						{sortedNotes.map((note) => (
							<Note
								key={note.id}
								article={note}
								handleDrop={handleDrop}
								onItemClick={onItemClick}
								isSelected={selectedIds?.includes(note.id)}
								onDelete={onDelete}
								confirmDeleteText={t("confirm-inbox-note-delete")}
							/>
						))}
					</div>
				</DndProvider>
			</ScrollableElement>
		</div>
	);
};

export default Inbox;
