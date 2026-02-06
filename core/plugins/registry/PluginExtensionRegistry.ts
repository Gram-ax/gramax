import type { Extension as ExtensionSDK } from "@gramax/sdk/editor";
import { ExtensionRegistryInterface, ExtensionType, ExtensionTypeMapper } from "@plugins/types";
import { MarkSpec, NodeSpec } from "@tiptap/pm/model";
import { PluginRegistry } from "./PluginRegistry";

function isNodeSpec(
	schema: ReturnType<ExtensionSDK["addSchema"]>,
	extensionType: string | undefined,
): schema is NodeSpec {
	return extensionType === "node";
}

function isMarkSpec(
	schema: ReturnType<ExtensionSDK["addSchema"]>,
	extensionType: string | undefined,
): schema is MarkSpec {
	return extensionType === "mark";
}

export class PluginExtensionRegistry
	extends PluginRegistry<ExtensionType, Map<string, ExtensionTypeMapper[ExtensionType][]>>
	implements ExtensionRegistryInterface
{
	registerExtension(pluginId: string, extension: ExtensionSDK) {
		const ext = extension.addExtension?.();
		const schema = extension.addSchema?.();

		if (schema) {
			if (isNodeSpec(schema, ext?.type)) {
				this.registerData(ExtensionType.NodeSchema, pluginId, schema);
			} else if (isMarkSpec(schema, ext?.type)) {
				this.registerData(ExtensionType.MarkSchema, pluginId, schema);
			}
		}

		if (ext) this.registerData(ExtensionType.Extension, pluginId, ext);

		const formatter = extension.addFormatter?.();
		if (formatter) this.registerData(ExtensionType.Formatter, pluginId, formatter);

		const button = extension.addButton?.();
		if (button) this.registerData(ExtensionType.Component, pluginId, button);
	}

	registerData<T extends ExtensionType>(type: T, pluginId: string, data: ExtensionTypeMapper[T]) {
		if (!this.data.has(type)) {
			this.data.set(type, new Map());
		}

		const typeRegistry = this.data.get(type);
		if (!typeRegistry.has(pluginId)) {
			typeRegistry.set(pluginId, []);
		}

		typeRegistry.get(pluginId).push(data);
	}

	getAllExtensions<T extends ExtensionType>(type: T): ExtensionTypeMapper[T][] {
		const typeRegistry = this.data.get(type);
		if (!typeRegistry) return [];

		return Array.from(typeRegistry.values()).flat() as ExtensionTypeMapper[T][];
	}

	getPluginExtensions<T extends ExtensionType>(pluginId: string, type: T): ExtensionTypeMapper[T][] {
		return (this.data.get(type)?.get(pluginId) as ExtensionTypeMapper[T][]) || [];
	}

	remove(pluginId: string) {
		for (const [, typeRegistry] of this.data) {
			typeRegistry.delete(pluginId);
		}
	}
}
