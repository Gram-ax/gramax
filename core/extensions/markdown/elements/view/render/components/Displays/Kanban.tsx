import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import Column from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/Column";
import { CustomDragLayer } from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/CustomDragLayer";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { ViewRenderGroup } from "@ext/properties/models";
import { useState } from "react";
import { DndProvider } from "react-dnd";

interface KanbanProps {
	groupby: string[];
	content: ViewRenderGroup[];
	disabled: boolean;
	updateArticle?: (articlePath: string, property: string, value: string) => void;
	className?: string;
}

const Kanban = ({ content, disabled = false, updateArticle, groupby, className }: KanbanProps) => {
	const noGroup = t("properties.validation-errors.no-groupby");
	if (!content?.[0]?.subgroups)
		return (
			<div className="error-message" data-focusable="true">
				{noGroup}
			</div>
		);

	const [data, setData] = useState<ViewRenderGroup[]>(content);

	useWatch(() => {
		setData(content);
	}, [content]);

	const onCardDrop = (columnID: number, cardID: number, newColumnID: number) => {
		if (disabled) return;
		const group = data[columnID].subgroups[0];
		const article = { ...group.articles[cardID] };
		const indexProperty = article.otherProps.findIndex((prop) => prop.name === groupby[0]);
		if (indexProperty !== -1 && article.otherProps?.length)
			article.otherProps[indexProperty].value = [data[newColumnID].group[0]];

		const newData = data.map((group, index) => {
			if (index === columnID) {
				const updatedSubgroups = [...group.subgroups];
				delete updatedSubgroups[0].articles[cardID];
				return { ...group, subgroups: updatedSubgroups };
			}
			if (index === newColumnID) {
				const updatedSubgroups = [...group.subgroups];
				updatedSubgroups[0].articles.push(article);
				return { ...group, subgroups: updatedSubgroups };
			}
			return group;
		});

		setData(newData);
		updateArticle?.(article.itemPath, groupby[0], newData[newColumnID].group[0]);
	};

	return (
		<DndProvider backend={ModifiedBackend}>
			<div className="tree-root">
				<WidthWrapper>
					<div className={className} data-focusable="true">
						<div className="kanban-wrapper">
							{data.map((group, index) => {
								if (!group.subgroups) return null;
								return (
									<Column
										id={index}
										disabled={disabled}
										key={group.group?.[0]}
										name={group.group?.join(" ")}
										cards={group.subgroups?.[0].articles}
										onCardDrop={onCardDrop}
									/>
								);
							})}
							<CustomDragLayer />
						</div>
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

	.kanban-wrapper {
		display: flex;
		flex-direction: row;
		width: min-content;

		> div:not(:last-child) {
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
