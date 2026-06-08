import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import type { Property, PropertyValue } from "@ext/properties/models";
import type { Node } from "@tiptap/pm/model";

class NodeProperties {
	private _properties: PropertyValue[];

	constructor(
		node: Node,
		private _catalogProperties: Map<string, Property>,
	) {
		this._properties = node.attrs.property || [];
	}

	get properties() {
		return this._properties;
	}

	public static toMarkdown(properties: PropertyValue[], formatter: FormatterType): string {
		return ` ${properties.map((prop) => formatter.openTag("property", { id: prop.id, value: prop.value?.join(",") }, true)).join(" ")}`;
	}

	public getMap() {
		const map = new Map(this._properties.map((prop) => [prop.id, prop.value]));

		return map;
	}

	public update(name: string, value: string) {
		const newProperties = updateProperty(name, value, this._catalogProperties, this._properties);
		this._properties = newProperties;
	}

	public remove(name: string) {
		const newProperties = deleteProperty(name, this._properties);
		this._properties = newProperties;
	}
}

export default NodeProperties;
