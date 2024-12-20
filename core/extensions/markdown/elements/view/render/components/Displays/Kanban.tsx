import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import Column from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/Column";
import { CustomDragLayer } from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/CustomDragLayer";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { Property, ViewRenderGroup } from "@ext/properties/models";
import { useCallback, useState } from "react";
import { DndProvider } from "react-dnd";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";

interface KanbanProps {
	groupby: string[];
	content: ViewRenderGroup[];
	disabled: boolean;
	className?: string;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
}

const Kanban = (props: KanbanProps) => {
	const { disabled, content, groupby, className, updateArticle } = props;
	const catalogProperties = PropertyServiceProvider.value?.properties;

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

	const onCardDrop = useCallback(
		(columnID: number, cardID: number, newColumnID: number, isDelete?: boolean) => {
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
				if (!isDelete && index === newColumnID) {
					const updatedSubgroups = [...group.subgroups];
					updatedSubgroups[0].articles.push(article);
					return { ...group, subgroups: updatedSubgroups };
				}
				return group;
			});

			setData(newData);
			updateArticle?.(article.itemPath, groupby[0], newData[newColumnID].group[0]);
		},
		[disabled, data, updateArticle, groupby],
	);

	const updateHandler = useCallback(
		(columnID: number, cardID: number, property: string, value: string, isDelete?: boolean) => {
			if (groupby.includes(property)) {
				const newColumnID = data.findIndex((group) => group.group?.[0] === value);
				return onCardDrop(columnID, cardID, newColumnID, isDelete || newColumnID === columnID);
			}

			const newData = data.slice();
			const article = newData[columnID].subgroups[0].articles[cardID];
			const newProps = isDelete
				? deleteProperty(property, article.otherProps, true)
				: updateProperty(property, value, catalogProperties, article.otherProps, true);

			article.otherProps = newProps as Property[];
			newData[columnID].subgroups[0].articles[cardID] = article;

			setData(newData);
			updateArticle?.(article.itemPath, property, value, isDelete);
		},
		[catalogProperties, updateArticle, data],
	);

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
										updateProperty={updateHandler}
									/>
								);
							})}
						</div>
						<CustomDragLayer />
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
