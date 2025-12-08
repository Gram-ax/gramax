declare module "*.svg" {
	const content: any;
	export default content;
}

declare module "pdfjs-dist/build/pdf.worker.min.js?url" {
	const value: string;
	export default value;
}

declare function confirm(message?: string): Promise<boolean>;
declare function refreshPage(): Promise<void>;
declare function clearData(): void;
declare function forceSave(): Promise<void> | void;
declare function reloadAll(): Promise<void>;
declare function onNavigate(path: string): void;
