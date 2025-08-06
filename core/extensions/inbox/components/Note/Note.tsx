import { classNames } from "@components/libs/classNames";
import { INBOX_DRAG_TYPE } from "@ext/inbox/models/consts";
import { InboxArticle, InboxDragDropData, InboxDragItemData } from "@ext/inbox/models/types";
import { useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import t from "@ext/localization/locale/translate";
import InboxService from "@ext/inbox/components/InboxService";
import Item from "@components/Layouts/LeftNavigationTabs/Item";
import styled from "@emotion/styled";
import Date from "@components/Atoms/Date";
import BaseRightExtensions from "@ext/articleProvider/components/BaseRightExtensions";
import useWatch from "@core-ui/hooks/useWatch";

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
			ref={containerRef}
			id={article.id}
			title={title}
			rightActionsWidth="0.75em"
			rightText={<Date date={article.props.date ?? ""} />}
			className={classNames("", { over: isOver })}
			rightActions={
				<BaseRightExtensions
					id={article.id}
					providerType="inbox"
					onMarkdownChange={onMarkdownChange}
					onDelete={onDelete}
					confirmDeleteText={confirmDeleteText}
				/>
			}
			onItemClick={onItemClick}
			isSelected={isSelected}
		/>
	);
};

export default Note;
