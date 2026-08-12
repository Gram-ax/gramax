import { FileLoader } from "@ext/markdown/elements/file/edit/components/Preview/FileLoader";
import FilePreviewError from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewError";
import { PreviewContainer } from "@ext/markdown/elements/file/edit/components/Preview/PreviewContainer";
import ExcelRenderer from "@ext/markdown/elements/file/edit/components/Preview/Views/ExcelRenderer/ExcelRenderer";
import type { FileError } from "@ext/markdown/elements/file/edit/model/fileErrors";
import { type ComponentType, type CSSProperties, memo, useCallback, useState } from "react";
import DocxRenderer from "./Views/DocxRenderer";
import ImageRenderer from "./Views/ImageRenderer";
import PdfRenderer from "./Views/PdfRenderer";
import PptxRenderer from "./Views/PptxRenderer";

export interface FilePreviewMeta {
	pageCount?: number;
	currentPage?: number;
	sheetName?: string;
	sheetNames?: string[];
	sheetCount?: number;
}

export interface FilePreviewProps {
	file: File;
	onError?: (error: unknown) => void;
	onMetaChange?: (meta: Partial<FilePreviewMeta>) => void;
	selectedSheetName?: string;
	zoom?: number;
}

export interface RendererProps extends FilePreviewProps {
	onLoad?: () => void;
}

const IMAGE_EXTENSIONS = ["gif", "jpeg", "jpg", "png", "webp"];

const getViewByType = (extension: string): ComponentType<RendererProps> => {
	if (IMAGE_EXTENSIONS.includes(extension)) return ImageRenderer;

	switch (extension) {
		case "docx":
			return DocxRenderer;
		case "pdf":
			return PdfRenderer;
		case "xlsx":
			return ExcelRenderer;
		case "xls":
			return ExcelRenderer;
		case "pptx":
			return PptxRenderer;
		default:
			throw new Error(`Unsupported file extension: ${extension}`);
	}
};

export const FilePreview = memo((props: FilePreviewProps) => {
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [error, setError] = useState<FileError>(null);
	const { file } = props;

	const extension: string = file ? (file?.name?.split(".").pop()?.toLowerCase() ?? "") : "";
	const Renderer = file ? getViewByType(extension) : null;
	const previewType = IMAGE_EXTENSIONS.includes(extension) ? "image" : extension;

	const onLoad = useCallback(() => {
		setIsLoaded(true);
	}, []);

	const onError = useCallback((error: FileError) => {
		setIsLoaded(true);
		setError(error);
		console.error(error);
	}, []);

	if (!Renderer) return null;

	const previewStyle = previewType === "image" ? undefined : ({ zoom: props.zoom ?? 1 } as CSSProperties);

	return (
		<PreviewContainer data-loaded={isLoaded} style={previewStyle}>
			{isLoaded ? null : <FileLoader />}
			{error ? <FilePreviewError error={error} /> : null}
			{!error && (
				<div className="file-preview-scale h-full w-full" data-preview-type={previewType}>
					<Renderer {...props} onError={onError} onLoad={onLoad} />
				</div>
			)}
		</PreviewContainer>
	);
});
