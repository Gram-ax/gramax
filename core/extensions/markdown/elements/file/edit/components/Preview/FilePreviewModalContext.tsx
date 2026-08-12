import type Path from "@core/FileProvider/Path/Path";
import type { FilePreviewMeta } from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { createContext, type ReactNode, useContext } from "react";

interface FilePreviewModalContextValue {
	activePage: number;
	file: File;
	hasPageNavigation: boolean;
	hasSheetNavigation: boolean;
	lastPage: number;
	maxZoom: number;
	meta: FilePreviewMeta;
	minZoom: number;
	openInSupportedApp?: () => void;
	pageItems: number[];
	path: Path;
	selectedSheetName?: string;
	sheetItems: string[];
	zoom: number;
	closeModal: () => void;
	goToNextPage: () => void;
	goToPreviousPage: () => void;
	goToSelectedPage: (page: string) => void;
	selectSheet: (sheetName: string) => void;
	zoomIn: () => void;
	zoomOut: () => void;
}

const FilePreviewModalContext = createContext<FilePreviewModalContextValue>(null);

interface FilePreviewModalProviderProps {
	children: ReactNode;
	value: FilePreviewModalContextValue;
}

export const FilePreviewModalProvider = ({ children, value }: FilePreviewModalProviderProps) => {
	return <FilePreviewModalContext.Provider value={value}>{children}</FilePreviewModalContext.Provider>;
};

export const useFilePreviewModalContext = () => {
	const value = useContext(FilePreviewModalContext);
	if (!value) throw new Error("FilePreviewModalContext is not available");
	return value;
};
