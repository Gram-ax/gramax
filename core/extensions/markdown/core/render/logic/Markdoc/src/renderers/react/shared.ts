import type { ComponentType } from "react";

type Component = ComponentType<unknown>;

export function tagName(
	name: string,
	components: Record<string, Component> | ((string: string) => Component),
): string | Component {
	return typeof name !== "string"
		? "Fragment"
		: name[0] !== name[0].toUpperCase()
		? name
		: components instanceof Function
		? components(name)
		: components[name];
}
