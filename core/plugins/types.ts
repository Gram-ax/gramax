import type { Extension, ExtensionButtonProps, FormatterType } from "@gramax/sdk/editor";
import type { PluginEventMap } from "@gramax/sdk/events";
import { MenuModifier } from "@gramax/sdk/ui";
import type { PlatformEnvironmentKey } from "@plugins/api/sdk/utilities";
import { AnyExtension } from "@tiptap/core";
import { MarkSpec, NodeSpec } from "@tiptap/pm/model";

import { ReactElement } from "react";

export enum ExtensionType {
	MarkSchema = "markSchema",
	NodeSchema = "nodeSchema",
	Extension = "extension",
	Formatter = "formatter",
	Component = "component",
}

export type ExtensionTypeMapper = {
	[ExtensionType.MarkSchema]: MarkSpec;
	[ExtensionType.NodeSchema]: NodeSpec;
	[ExtensionType.Extension]: AnyExtension;
	[ExtensionType.Formatter]: FormatterType;
	[ExtensionType.Component]: (props: ExtensionButtonProps) => ReactElement;
};

export interface PluginMetadata {
	id: string;
	name: string;
	version: string;
	entryPoint: string;
	platform?: PlatformEnvironmentKey[];
	description?: string;
	author?: string;
	disabled: boolean;
	isBuiltIn?: boolean;
	icon?: string;
	navigateTo?: string;
	onSave?: (newSettings: unknown) => Promise<void>;
}

export interface PluginData extends PluginConfig {
	blobUrl: string;
}

export interface PluginConfig {
	metadata: PluginMetadata;
	script: string;
	locale?: Record<string, Record<string, string>>;
}

export interface ExtensionRegistryInterface {
	registerExtension(pluginId: string, extension: Extension): void;
	registerData<T extends ExtensionType>(type: T, pluginId: string, data: ExtensionTypeMapper[T]): void;
	getAllExtensions<T extends ExtensionType>(type: T): ExtensionTypeMapper[T][];
	getPluginExtensions<T extends ExtensionType>(pluginId: string, type: T): ExtensionTypeMapper[T][];
}

export interface MenuRegistryInterface {
	registerModifier(pluginId: string, modifier: MenuModifier): void;
}

export interface EventRegistryInterface {
	registerEvent<E extends keyof PluginEventMap>(pluginId: string, event: E, handler: PluginEventMap[E]): void;
}
