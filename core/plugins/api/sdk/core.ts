import { EventRegistryInterface, ExtensionRegistryInterface, MenuRegistryInterface } from "@plugins/types";
import { t as tSdk } from "@gramax/sdk/localization";
import type { ModalProps, Modal as ModalSdk } from "@gramax/sdk/ui";
import { PlatformServiceNew } from "@core-ui/PlatformService";

export enum ExtensionType {
	MarkSchema = "markSchema",
	NodeSchema = "nodeSchema",
	Extension = "extension",
	Formatter = "formatter",
	Component = "component",
}

export interface SdkDependencies {
	extensions: ExtensionRegistryInterface;
	menus: MenuRegistryInterface;
	events: EventRegistryInterface;
	t: typeof tSdk;
	Modal: typeof ModalSdk;
	isPlatform: typeof PlatformServiceNew.isPlatform;
}

export interface ModalInstance {
	setTitle(title: string): this;
	setContent(content: ModalProps["content"]): this;
	setStatus(status: ModalProps["status"]): this;
	setDescription(description: ModalProps["description"]): this;
	setPrimaryButtonProps(props: ModalProps["primaryButtonProps"]): this;
	setSecondaryButtonProps(props: ModalProps["secondaryButtonProps"]): this;
	open(): void;
}

const SDK_DEPS = "@gramax/sdk:deps";

export function getDeps(): SdkDependencies {
	const d = globalThis[SDK_DEPS];
	if (!d) throw new Error("SDK not initialized. Call initializeSdk() first.");
	return d;
}

export function initializeSdk(dependencies: SdkDependencies): void {
	globalThis[SDK_DEPS] = dependencies;
}
