import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import type { PropertyID, PropertyValue } from "@ext/properties/models";
import { useCurrentEditor } from "@tiptap/react";
import { useCallback } from "react";

interface UseUpdateNodePropertyProps {
	pos: number;
	property: PropertyID;
	value: string;
	properties: PropertyValue[];
}

export const useUpdateNodeProperty = () => {
	const { properties: catalogProperties } = PropertyServiceProvider.value;
	const { editor } = useCurrentEditor();

	const update = useCallback(
		({ pos, property, value, properties }: UseUpdateNodePropertyProps) => {
			const newProperties = updateProperty(property, value, catalogProperties, properties, false);
			if (!newProperties) return;

			const tr = editor.view.state.tr;
			tr.setNodeAttribute(pos, "property", newProperties);
			editor.view.dispatch(tr);
		},
		[catalogProperties, editor],
	);

	const remove = useCallback(
		({ pos, property, properties }: Omit<UseUpdateNodePropertyProps, "value">) => {
			const newProperties = deleteProperty(property, properties);

			const tr = editor.view.state.tr;
			tr.setNodeAttribute(pos, "property", newProperties);
			editor.view.dispatch(tr);
		},
		[editor],
	);

	return { update, remove };
};
