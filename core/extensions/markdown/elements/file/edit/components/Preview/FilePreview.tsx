import { FileLoader } from "@ext/markdown/elements/file/edit/components/Preview/FileLoader";
import FilePreviewError from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewError";
import { PreviewContainer } from "@ext/markdown/elements/file/edit/components/Preview/PreviewContainer";
import ExcelRenderer from "@ext/markdown/elements/file/edit/components/Preview/Views/ExcelRenderer/ExcelRenderer";
import type { FileError } from "@ext/markdown/elements/file/edit/model/fileErrors";
import { type ComponentType, memo, useCallback, useState } from "react";
import DocxRenderer from "./Views/DocxRenderer";
import PdfRenderer from "./Views/PdfRenderer";
import PptxRenderer from "./Views/PptxRenderer";

export interface FilePreviewProps {
	file: File;
	onError?: (error: unknown) => void;
}

export interface RendererProps extends FilePreviewProps {
	onLoad?: () => void;
}

const getViewByType = (extension: string): ComponentType<RendererProps> => {
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

	const onLoad = useCallback(() => {
		setIsLoaded(true);
	}, []);

	const onError = useCallback((error: FileError) => {
		setIsLoaded(true);
		setError(error);
		console.error(error);
	}, []);

	if (!Renderer) return null;

	return (
		<PreviewContainer data-loaded={isLoaded}>
			{isLoaded ? null : <FileLoader />}
			{error ? <FilePreviewError error={error} /> : null}
			{!error && <Renderer {...props} onError={onError} onLoad={onLoad} />}
		</PreviewContainer>
	);
});
