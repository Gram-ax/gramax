import Date from "@components/Atoms/Date";
import Item from "@components/Layouts/LeftNavigationTabs/Item";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import BaseRightExtensions from "@ext/articleProvider/components/BaseRightExtensions";
import InboxService from "@ext/inbox/components/InboxService";
import { INBOX_DRAG_TYPE } from "@ext/inbox/models/consts";
import { InboxArticle, InboxDragDropData, InboxDragItemData } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import { useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

interface NoteProps {
	article: InboxArticle;
	isSelected: boolean;
	confirmDeleteText?: string;
	handleDrop: (data: InboxDragDropData) => void;
	onItemClick: (id: string, target: HTMLElement) => void;
	onDelete: (id: string) => void;
}

const StyledNote = styled(Item)`
	&.over {
		background-color: var(--color-nav-article-drop-target);
	}
`;

const Note = ({ article, handleDrop, onItemClick, isSelected, onDelete, confirmDeleteText }: NoteProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const title = article.title.length ? article.title : t("article.no-name");

	const [{ isOver }, drop] = useDrop({
		accept: INBOX_DRAG_TYPE,
		canDrop: (data: InboxDragItemData) => data.draggedId !== article.id,
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
		drop: (data: InboxDragItemData) => {
			const droppedData = { droppedId: article.id };
			handleDrop({ ...data, ...droppedData });
		},
	});

	const [, drag] = useDrag(() => ({
		type: INBOX_DRAG_TYPE,
		item: { draggedId: article.id },
	}));

	useWatch(() => {
		if (!containerRef.current) return;
		drag(drop(containerRef.current));
	}, [containerRef.current]);

	const onMarkdownChange = useCallback(
		(id: string) => {
			if (!isSelected) return;
			InboxService.closeNote(id);

			setTimeout(() => {
				InboxService.openNote(article, containerRef.current);
			}, 0);
		},
		[article, isSelected, containerRef.current],
	);

	return (
		<StyledNote
			className={classNames("", { over: isOver })}
			id={article.id}
			isSelected={isSelected}
			onItemClick={onItemClick}
			ref={containerRef}
			rightActions={
				<BaseRightExtensions
					confirmDeleteText={confirmDeleteText}
					id={article.id}
					onDelete={onDelete}
					onMarkdownChange={onMarkdownChange}
					providerType="inbox"
				/>
			}
			rightActionsWidth="0.75em"
			rightText={<Date date={article.props.date ?? ""} />}
			title={title}
		/>
	);
};

export default Note;
