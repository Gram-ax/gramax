import { FileLoader } from "@ext/markdown/elements/file/edit/components/Preview/FileLoader";
import { PreviewContainer } from "@ext/markdown/elements/file/edit/components/Preview/PreviewContainer";
import ExcelRenderer from "@ext/markdown/elements/file/edit/components/Preview/Views/ExcelRenderer/ExcelRenderer";
import { type ComponentType, memo, useCallback, useState } from "react";
import DocxRenderer from "./Views/DocxRenderer";
import PdfRenderer from "./Views/PdfRenderer";

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
		default:
			throw new Error(`Unsupported file extension: ${extension}`);
	}
};

export const FilePreview = memo((props: FilePreviewProps) => {
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const { file } = props;

	const extension: string = file ? (file?.name?.split(".").pop()?.toLowerCase() ?? "") : "";
	const Renderer = file ? getViewByType(extension) : null;

	const onLoad = useCallback(() => {
		setIsLoaded(true);
	}, []);

	const onError = useCallback(() => {
		setIsLoaded(false);
	}, []);

	if (!Renderer) return null;

	return (
		<PreviewContainer data-loaded={isLoaded}>
			{isLoaded ? null : <FileLoader />}
			<Renderer {...props} onError={onError} onLoad={onLoad} />
		</PreviewContainer>
	);
});
