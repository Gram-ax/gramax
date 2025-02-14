declare module "*.svg" {
	const content: any;
	export default content;
}

declare function confirm(message?: string): Promise<boolean>;
declare function refreshPage(): Promise<void>;
declare function clearData(): void;
declare function forceSave(): Promise<void>;
declare function reloadAll(): Promise<void>;
