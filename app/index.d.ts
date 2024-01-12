declare module "*.svg" {
	const content: any;
	export default content;
}

declare function confirm(message?: string): Promise<boolean>;
declare function refreshPage(): Promise<void>;
declare function forceTrollCaller(): Promise<void>;
