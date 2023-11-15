declare module "*.svg" {
	const content: any;
	export default content;
}

declare function confirm(message?: string): Promise<boolean>;
