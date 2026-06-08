import useWatch from "@core-ui/hooks/useWatch";
import moveCardInKanban from "@ext/markdown/elements/view/render/logic/kanbanMoveCard";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import type { Property, PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { useCallback, useRef, useState } from "react";

export interface UseKanbanBoardParams {
	content: ViewRenderGroup[];
	disabled: boolean;
	groupby: string[];
	defs: PropertyValue[];
	catalogProperties: Map<string, Property> | undefined;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
}

export interface UseKanbanBoardResult {
	data: ViewRenderGroup[];
	onCardDrop: (
		columnID: number,
		cardID: number,
		newColumnID: number,
		isDelete?: boolean,
		selectedValue?: string,
	) => void;
	updateHandler: (columnID: number, itemPath: string, property: string, value: string, isDelete?: boolean) => void;
}

export const useViewKanbanBoard = (props: UseKanbanBoardParams): UseKanbanBoardResult => {
	const { content, disabled, groupby, defs, catalogProperties, updateArticle } = props;
	const [data, setData] = useState<ViewRenderGroup[]>(content);
	const dataRef = useRef(data);
	dataRef.current = data;

	useWatch(() => {
		setData(content);
	}, [content]);

	const onCardDrop = useCallback(
		(columnID: number, cardID: number, newColumnID: number, isDelete?: boolean, selectedValue?: string) => {
			if (disabled) return;
			setData((prevData) => {
				const {
					data: newData,
					newValue,
					isDelete: effectiveIsDelete,
				} = moveCardInKanban({
					data: prevData,
					columnID,
					cardID,
					newColumnID,
					groupbyProperty: groupby[0],
					defs,
					isDelete,
					selectedValue,
				});

				const article = prevData[columnID]?.subgroups?.[0]?.articles[cardID];
				article && updateArticle?.(article.itemPath, groupby[0], newValue, effectiveIsDelete);

				return newData;
			});
		},
		[disabled, updateArticle, groupby, defs],
	);

	const updateHandler = useCallback(
		(columnID: number, itemPath: string, property: string, value: string, isDelete?: boolean) => {
			const currentData = dataRef.current;
			const articles = currentData[columnID]?.subgroups?.[0]?.articles ?? [];
			const cardID = articles.findIndex((a) => a.itemPath === itemPath);
			if (cardID === -1) return;

			if (groupby.includes(property)) {
				const newColumnID = currentData.findIndex((group) => group.group?.[0] === value);
				return onCardDrop(columnID, cardID, newColumnID, isDelete || newColumnID === columnID, value);
			}

			setData((prevData) => {
				const newData = prevData.slice();
				const article = { ...newData[columnID].subgroups[0].articles[cardID] };
				const newProps = isDelete
					? deleteProperty(property, article.otherProps, true)
					: updateProperty(property, value, catalogProperties, article.otherProps, true);

				article.otherProps = newProps as Property[];
				newData[columnID].subgroups[0].articles[cardID] = article;

				return newData;
			});
			updateArticle?.(itemPath, property, value, isDelete);
		},
		[catalogProperties, updateArticle, groupby, onCardDrop],
	);

	return { data, onCardDrop, updateHandler };
};
