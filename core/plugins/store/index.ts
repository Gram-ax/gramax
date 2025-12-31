import { MenuItemDescriptorApp } from "@components/Actions/CatalogActions/buildCatalogMenu";
import type { MenuContext } from "@gramax/sdk/ui";
import type { PluginProps } from "@gramax/sdk";
import { ServiceKey } from "@plugins/core/PluginContainer";
import { PluginStore, PluginStoreType } from "@plugins/store/PluginStore";
import { ExtensionType, PluginConfig } from "@plugins/types";
import { Extensions } from "@tiptap/core";

export const loadPlugins = async (plugins: Parameters<PluginStoreType["init"]>[0], props?: PluginProps) => {
	await PluginStore.getState().init(plugins, props);
};

export const useIsPluginReady = () => {
	return PluginStore((state) => state.pluginsReady);
};

export const makePluginReady = () => {
	PluginStore.setState({ pluginsReady: true });
};

export const clearAllPlugins = () => {
	PluginStore.getState().clear();
};

export const deletePlugin = (pluginId: string) => {
	PluginStore.getState().remove(pluginId);
};

export const addPlugin = async (pluginRaw: PluginConfig) => {
	await PluginStore.getState().add(pluginRaw);
};

export const getPluginIsReady = () => PluginStore.getState().pluginsReady;
export const getPluginSchemas = (): { nodes: Record<string, any>; marks: Record<string, any> } => {
	const extensionRegistry = PluginStore.getState()?.manager?.container.get(ServiceKey.Extensions);

	const schemas: Array<{ type: ExtensionType.MarkSchema | ExtensionType.NodeSchema; data: any[] }> = [
		{ type: ExtensionType.MarkSchema, data: extensionRegistry?.getAllExtensions(ExtensionType.MarkSchema) ?? [] },
		{ type: ExtensionType.NodeSchema, data: extensionRegistry?.getAllExtensions(ExtensionType.NodeSchema) ?? [] },
	];

	const result = { nodes: {} as Record<string, any>, marks: {} as Record<string, any> };

	for (const { type, data } of schemas) {
		const target = type === ExtensionType.NodeSchema ? result.nodes : result.marks;
		for (const schema of data) {
			Object.assign(target, schema);
		}
	}

	return result;
};

export const getPluginFormatters = () => {
	const formatters =
		PluginStore.getState()
			?.manager?.container.get(ServiceKey.Extensions)
			.getAllExtensions(ExtensionType.Formatter) ?? [];
	const result = {};
	for (const formatter of formatters) {
		Object.assign(result, formatter);
	}
	return result;
};

export const getPluginComponents = () =>
	PluginStore.getState()?.manager?.container.get(ServiceKey.Extensions).getAllExtensions(ExtensionType.Component) ??
	[];

export const modifyEditorExtensions = (extensions: Extensions): Extensions => {
	const pluginExtensions =
		PluginStore.getState()
			?.manager?.container.get(ServiceKey.Extensions)
			.getAllExtensions(ExtensionType.Extension) ?? [];

	return extensions.concat(pluginExtensions);
};

export const applyMenuModifiers = async (
	items: Array<MenuItemDescriptorApp>,
	context: MenuContext,
): Promise<Array<MenuItemDescriptorApp>> => {
	return (
		(await PluginStore.getState()?.manager?.container.get(ServiceKey.Menus).applyModifiers(items, context)) ?? items
	);
};

export const togglePluginState = async (pluginId: string, disabled: boolean) => {
	await PluginStore.getState().toggle(pluginId, disabled);
};
