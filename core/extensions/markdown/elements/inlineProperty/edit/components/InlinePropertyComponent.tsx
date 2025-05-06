import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import InlineProperty from "@ext/markdown/elements/inlineProperty/edit/components/InlineProperty";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import combineProperties from "@ext/properties/logic/combineProperties";
import { Property } from "@ext/properties/models";
import { NodeSelection } from "@tiptap/pm/state";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";

const InlinePropertyComponent = ({ node, updateAttributes, extension, editor, selected }: NodeViewProps) => {
	const bind = node.attrs.bind as string;
	const isSelected = selected && editor.state.selection instanceof NodeSelection;
	const { properties, articleProperties, setArticleProperties } = PropertyServiceProvider.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onUpdate = (newBind: string) => {
		updateAttributes({ bind: newBind });
	};

	const deleteHandler = useCallback(
		(id: string) => {
			setArticleProperties((prevProps: Property[]) => {
				const newProps = deleteProperty(id, prevProps);
				if (!newProps) return prevProps;

				FetchService.fetch(
					apiUrlCreator.updateItemProps(),
					JSON.stringify({ ...articleProps, properties: newProps }),
				);

				return combineProperties(newProps, Array.from(properties.values()));
			});
		},
		[articleProps, properties, articleProperties],
	);

	const updateHandler = useCallback(
		(id: string, value?: string) => {
			setArticleProperties((prevProps: Property[]) => {
				const newProps = updateProperty(id, value, properties, prevProps);
				if (!newProps) return prevProps;

				FetchService.fetch(
					apiUrlCreator.updateItemProps(),
					JSON.stringify({ ...articleProps, properties: newProps }),
				);

				return combineProperties(newProps, Array.from(properties.values()));
			});
		},
		[articleProps, properties, articleProperties],
	);

	const onSubmit = useCallback(
		(id: string, value: string, isDelete?: boolean) => {
			if (isDelete) deleteHandler(id);
			else updateHandler(id, value);
		},
		[updateHandler, deleteHandler],
	);

	return (
		<NodeViewWrapper as="span" draggable={true} data-drag-handle>
			<InlineProperty
				bind={bind}
				selected={isSelected}
				onUpdate={onUpdate}
				props={properties}
				isEditable={extension.options.canChangeProps}
				onChangeProperty={onSubmit}
			/>
		</NodeViewWrapper>
	);
};

export default InlinePropertyComponent;
