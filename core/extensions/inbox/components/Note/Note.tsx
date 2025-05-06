import { classNames } from "@components/libs/classNames";
import NoteRightExtensions from "@ext/inbox/components/Note/NoteRightExtensions";
import { INBOX_DRAG_TYPE } from "@ext/inbox/models/consts";
import { InboxArticle, InboxDragDropData, InboxDragItemData } from "@ext/inbox/models/types";
import { useCallback, useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import t from "@ext/localization/locale/translate";
import InboxService from "@ext/inbox/components/InboxService";
import Item from "@components/Layouts/LeftNavigationTabs/Item";
import styled from "@emotion/styled";
import Date from "@components/Atoms/Date";

interface NoteProps {
	article: InboxArticle;
	handleDrop: (data: InboxDragDropData) => void;
	onItemClick: (logicPath: string) => void;
	isSelected: boolean;
}

const StyledNote = styled(Item)`
	&.over {
		background-color: var(--color-nav-article-drop-target);
	}
`;

const Note = ({ article, handleDrop, onItemClick, isSelected }: NoteProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const title = article.title.length ? article.title : t("article.no-name");

	const [{ isOver }, drop] = useDrop({
		accept: INBOX_DRAG_TYPE,
		canDrop: (data: InboxDragItemData) => data.draggedLogicPath !== article.logicPath,
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
		drop: (data: InboxDragItemData) => {
			const droppedData = { droppedLogicPath: article.logicPath };
			handleDrop({ ...data, ...droppedData });
		},
	});

	const [, drag] = useDrag(() => ({
		type: INBOX_DRAG_TYPE,
		item: { draggedLogicPath: article.logicPath },
	}));

	const handleRef = useCallback(
		(ref) => {
			containerRef.current = ref;
			drag(drop(ref));
		},
		[drop, drag],
	);

	useEffect(() => {
		if (!isSelected) return;
		InboxService.openNote(article, containerRef.current);
	}, [isSelected]);

	return (
		<StyledNote
			ref={handleRef}
			id={article.logicPath}
			title={title}
			rightText={<Date date={article.props.date ?? ""} />}
			className={classNames("", { over: isOver })}
			rightActions={<NoteRightExtensions article={article} />}
			onItemClick={onItemClick}
			isSelected={isSelected}
		/>
	);
};

export default Note;
