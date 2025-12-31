import type { Extension as ExtensionSDK } from "@gramax/sdk/editor";

export abstract class Extension implements ExtensionSDK {
	declare addExtension: () => ReturnType<ExtensionSDK["addExtension"]>;
	declare addSchema: () => ReturnType<ExtensionSDK["addSchema"]>;
	declare addFormatter: () => ReturnType<ExtensionSDK["addFormatter"]>;
	declare addButton: () => ReturnType<ExtensionSDK["addButton"]>;
}
