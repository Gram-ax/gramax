import { useEffect, useState } from "react";
import type { RendererProps } from "../FilePreview";

const ImageRenderer = ({ file, onLoad, onError, onMetaChange, zoom = 1 }: RendererProps) => {
	const [src, setSrc] = useState<string>(null);

	useEffect(() => {
		const url = URL.createObjectURL(file);
		setSrc(url);
		onMetaChange?.({ currentPage: undefined, pageCount: undefined, sheetCount: undefined, sheetName: undefined });

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [file, onMetaChange]);

	if (!src) return null;

	return (
		<div className="box-border flex min-h-full w-full items-center justify-center pb-6">
			<img
				alt={file.name}
				className="block max-h-full max-w-full rounded-sm object-contain shadow-soft-sm"
				onError={onError}
				onLoad={onLoad}
				src={src}
				style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
			/>
		</div>
	);
};

export default ImageRenderer;
