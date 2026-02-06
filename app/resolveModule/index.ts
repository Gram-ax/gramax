/** biome-ignore-all lint/suspicious/noExplicitAny: idc */

import type DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputProps";
import type FileInput from "@components/Atoms/FileInput/FileInputProps";
import type useUrlImage from "@components/Atoms/Image/useUrlImage";
import type { Router } from "@core/Api/Router";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type {
	GetImageByPathOptions,
	GetImageByPathResult,
} from "@ext/markdown/elements/image/export/NextImageProcessor";
import type { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import type useUrlObjectImage from "apps/browser/src/hooks/useUrlObjectImage";
import type BrowserCookie from "apps/browser/src/logic/BrowserCookie";
import type NextCookie from "apps/next/logic/NextCookie";
import type TauriCookie from "apps/tauri/src/cookie/TauriCookie";
import type { httpFetch } from "../../apps/tauri/src/window/commands";
import type Link from "../../core/components/Atoms/Link";

export interface DynamicModules {
	Link: typeof Link;
	Router: any;
	Fetcher: any;
	useImage: typeof useUrlImage | typeof useUrlObjectImage;
	FileInput: FileInput;
	DiffFileInput: DiffFileInput;
	openInExplorer: (path: string) => void | Promise<void>;
	openInWeb: (url: string) => void | Promise<void> | Window;
	enterpriseLogin: (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => Promise<void>;
	openDirectory: () => string | Promise<string>;
	openWindowWithUrl: (url: string) => void | Promise<void>;
	openChildWindow: ({
		url,
		redirect,
		name,
		features,
	}: {
		url: string;
		redirect?: string;
		name?: string;
		features?: string;
	}) => Promise<Window> | Window;
	httpFetch: typeof httpFetch;
	setBadge: (count: number | null) => void | Promise<void>;
}

export interface BackendDynamicModules {
	Cookie: typeof BrowserCookie | typeof TauriCookie | typeof NextCookie;
	initWasm: (corsProxy: string) => Promise<void>;
	svgToPng: (svg: string, size: ImageDimensions, scale: number) => Promise<Buffer>;
	getImageSizeFromImageData: (imageBuffer: Buffer, maxWidth?: number, maxHeight?: number) => Promise<ImageDimensions>;
	getImageFromDom: (tag: string, fitContent: boolean) => Promise<Buffer>;
	moveToTrash: (path: string) => Promise<void>;
	getDOMParser: () => DOMParser;
	getXMLSerializer: () => XMLSerializer;
	setSessionData: (key: string, data: string) => Promise<void>;
	pdfLoadFont: (fontPath: string) => Promise<ArrayBuffer>;
	getImageByPath: (options: GetImageByPathOptions) => Promise<GetImageByPathResult>;
}
