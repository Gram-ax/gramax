import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import Column from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/Column";
import { CustomDragLayer } from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/CustomDragLayer";
import { useViewKanbanBoard } from "@ext/markdown/elements/view/render/logic/hooks/useViewKanbanBoard";
import { useDragDrop } from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { DndProvider } from "react-dnd";

interface KanbanProps {
	defs: PropertyValue[];
	groupby: string[];
	content: ViewRenderGroup[];
	disabled: boolean;
	className?: string;
	commentId?: string;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
}

const Kanban = (props: KanbanProps) => {
	const { disabled, content, groupby, className, updateArticle, commentId, defs } = props;
	const catalogProperties = PropertyServiceProvider.value?.properties;

	const noGroup = t("properties.validation-errors.no-groupby");

	const { backend, options } = useDragDrop();

	const { data, onCardDrop, updateHandler } = useViewKanbanBoard({
		content,
		disabled,
		groupby,
		defs,
		catalogProperties,
		updateArticle,
	});

	if (!content?.[0]?.subgroups)
		return (
			<div className="error-message" data-focusable="true">
				{noGroup}
			</div>
		);

	return (
		<DndProvider backend={backend} options={options}>
			<div className="tree-root">
				<WidthWrapper>
					<div className={className} data-focusable="true">
						<BlockCommentView commentId={commentId}>
							<div className="kanban-wrapper">
								{data.map((group, index) => {
									if (!group.subgroups) return null;
									return (
										<Column
											cards={group.subgroups?.[0].articles}
											disabled={disabled}
											id={index}
											key={group.group?.[0]}
											name={group.group?.join(" ")}
											onCardDrop={onCardDrop}
											updateProperty={updateHandler}
										/>
									);
								})}
							</div>
							<CustomDragLayer />
						</BlockCommentView>
					</div>
				</WidthWrapper>
			</div>
		</DndProvider>
	);
};

export default styled(Kanban)`
	width: max-content;
	max-width: none;
	border-radius: var(--radius-small);

	&[data-focusable="true"] {
		outline-offset: -4px !important;
	}

	.block-comment-view {
		outline-offset: -2px;
	}

	.kanban-wrapper {
		display: flex;
		flex-direction: row;
		width: min-content;

		> .column:not(:last-child) {
			border-right: 1px solid var(--color-line);
		}
	}

	@keyframes rotate {
		0% {
			transform: rotate(0);
		}
		100% {
			transform: rotate(-3deg);
		}
	}
`;
