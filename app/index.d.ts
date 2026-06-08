declare type NextImage = {
	src: string;
	width: number;
	height: number;
};

declare module "*.svg" {
	const content: string | NextImage;
	export default content;
}

declare module "*.png" {
	const content: string | NextImage;
	export default content;
}

declare module "*?worker" {
	const workerConstructor: {
		new (): Worker;
	};
	export default workerConstructor;
}

declare function confirm(message?: string): Promise<boolean>;
declare function refreshPage(): Promise<void>;
declare function clearData(): void;

declare function reloadAll(): Promise<void>;
declare function onNavigate(path: string): void;
