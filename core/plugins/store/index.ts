import type { MenuItemDescriptorApp } from "@components/Actions/CatalogActions/buildCatalogMenu";
import type { PluginProps } from "@gramax/sdk";
import type { MenuContext } from "@gramax/sdk/ui";
import { ServiceKey } from "@plugins/core/PluginContainer";
import { PluginStore, type PluginStoreType } from "@plugins/store/PluginStore";
import { ExtensionType, type PluginConfig } from "@plugins/types";
import type { Extensions } from "@tiptap/core";

export const loadPlugins = async (
	plugins: Parameters<PluginStoreType["init"]>[0],
	props?: PluginProps,
	app?: unknown,
) => {
	await PluginStore.getState().init(plugins, props, app);
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

// biome-ignore lint/suspicious/noExplicitAny: prosemirror schema spec uses untyped plain objects
export const getPluginSchemas = (): { nodes: Record<string, any>; marks: Record<string, any> } => {
	const extensionRegistry = PluginStore.getState()?.manager?.container.get(ServiceKey.Extensions);

	// biome-ignore lint/suspicious/noExplicitAny: prosemirror schema spec uses untyped plain objects
	const schemas: Array<{ type: ExtensionType.MarkSchema | ExtensionType.NodeSchema; data: any[] }> = [
		{ type: ExtensionType.MarkSchema, data: extensionRegistry?.getAllExtensions(ExtensionType.MarkSchema) ?? [] },
		{ type: ExtensionType.NodeSchema, data: extensionRegistry?.getAllExtensions(ExtensionType.NodeSchema) ?? [] },
	];

	// biome-ignore lint/suspicious/noExplicitAny: prosemirror schema spec uses untyped plain objects
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

/** Reactive hook — re-renders consumers whenever the plugin manager changes. */
export const usePluginComponents = () => {
	const manager = PluginStore((state) => state.manager);
	return manager?.container.get(ServiceKey.Extensions).getAllExtensions(ExtensionType.Component) ?? [];
};

export const modifyEditorExtensions = (extensions: Extensions): Extensions => {
	const pluginExtensions =
		PluginStore.getState()
			?.manager?.container.get(ServiceKey.Extensions)
			.getAllExtensions(ExtensionType.Extension) ?? [];

	return extensions.concat(pluginExtensions);
};

export const getPluginParseSignature = () => {
	const { pluginsData } = PluginStore.getState();
	return JSON.stringify(
		pluginsData
			.map((plugin) => ({
				id: plugin.metadata.id,
				version: plugin.metadata.version,
				disabled: plugin.metadata.disabled,
				scriptLength: plugin.script.length,
			}))
			.sort((a, b) => a.id.localeCompare(b.id)),
	);
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
