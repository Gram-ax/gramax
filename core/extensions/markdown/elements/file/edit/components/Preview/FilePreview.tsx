import { ComponentType, memo, useCallback, useState } from "react";
import DocxRenderer from "./DocxRenderer";
import PdfRenderer from "./PdfRenderer";
import { PreviewContainer } from "@ext/markdown/elements/file/edit/components/Preview/PreviewContainer";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";

export interface FilePreviewProps {
	file: File;
	onError?: (error: unknown) => void;
}

export interface RendererProps extends FilePreviewProps {
	onLoad?: () => void;
}

const getRendererByExtension = (extension: string): ComponentType<RendererProps> => {
	switch (extension) {
		case "docx":
			return DocxRenderer;
		case "pdf":
			return PdfRenderer;
		default:
			throw new Error(`Unsupported file extension: ${extension}`);
	}
};

export const FilePreview = memo((props: FilePreviewProps) => {
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const { file } = props;
	if (!file) return null;

	const extension: string = file.name.split(".").pop()?.toLowerCase() ?? "";
	const Renderer = getRendererByExtension(extension);

	const onLoad = useCallback(() => {
		setIsLoaded(true);
	}, []);

	const onError = useCallback(() => {
		setIsLoaded(false);
	}, []);

	if (!Renderer) return null;
	return (
		<PreviewContainer>
			{isLoaded ? null : <SpinnerLoader fullScreen />}
			<Renderer {...props} onLoad={onLoad} onError={onError} />
		</PreviewContainer>
	);
});
