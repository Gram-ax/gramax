import AnimatedExtension from "@components/Atoms/ItemWrapper";
import Date from "@components/Atoms/Date";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import NoteRightExtensions from "@ext/inbox/components/Note/NoteRightExtensions";
import { INBOX_DRAG_TYPE } from "@ext/inbox/models/consts";
import { InboxArticle, InboxDragDropData, InboxDragItemData } from "@ext/inbox/models/types";
import { memo, MouseEvent, useCallback, useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import t from "@ext/localization/locale/translate";
import InboxService from "@ext/inbox/components/InboxService";

interface NoteProps {
	article: InboxArticle;
	handleDrop: (data: InboxDragDropData) => void;
	onItemClick: (logicPath: string) => void;
	isSelected: boolean;
	className?: string;
}

const Note = ({ article, handleDrop, onItemClick, isSelected, className }: NoteProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
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

	const handleClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			event.stopPropagation();
			event.preventDefault();
			onItemClick(article.logicPath);
		},
		[article.logicPath, onItemClick],
	);

	useEffect(() => {
		if (!isSelected) return;
		InboxService.openNote(article, containerRef.current);
	}, [isSelected]);

	return (
		<div
			ref={handleRef}
			className={classNames(className, { selected: isSelected, over: isOver })}
			onClick={handleClick}
			data-qa="qa-clickable"
		>
			<AnimatedExtension
				text={<Date date={article.props.date ?? ""} />}
				rightActions={<NoteRightExtensions article={article} />}
				width={"1.5em"}
				className="note-wrapper"
			>
				<div className="inbox-note">
					<div className="note-header">
						<span className="note-title">
							{article.title.length ? article.title : t("article.no-name")}
						</span>
					</div>
				</div>
			</AnimatedExtension>
		</div>
	);
};

export default memo(styled(Note)`
	cursor: pointer;

	.note-wrapper {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.inbox-note {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.2rem 0;
		line-height: 1.3rem;
		padding-left: 1rem !important;
		padding-right: 0.9rem !important;
		color: var(--color-nav-item);
		font-weight: var(--font-weight-right-nav-active-item);
		overflow: hidden;
	}

	&.over {
		background-color: var(--color-nav-article-drop-target);
	}

	&:hover,
	&:has(*[aria-expanded="true"]) {
		background-color: var(--color-lev-sidebar-hover);
	}

	&:hover .right-actions,
	&:has(*[aria-expanded="true"]) .right-actions {
		padding-left: unset !important;
		width: 1.5em;
		opacity: 1;
		gap: 0.6rem;
		margin-right: 0.2rem;
	}

	&.selected,
	&.selected .note-title {
		color: var(--color-nav-item-selected);
		background-color: var(--color-article-bg);
	}

	.note-header {
		display: flex;
		overflow: hidden;
		align-items: center;
	}

	.note-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.right-extensions {
		display: flex;
		align-items: center;
		padding-right: 1rem;
		white-space: nowrap;
		justify-content: end;
	}
`);
