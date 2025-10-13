import { useEffect, useState } from "react";
import { RendererProps } from "./FilePreview";

const PdfRenderer = ({ file, onLoad, onError }: RendererProps) => {
	const [url, setUrl] = useState<string>(null);

	useEffect(() => {
		if (url) URL.revokeObjectURL(url);
		const newUrl = URL.createObjectURL(file);
		setUrl(newUrl);

		return () => URL.revokeObjectURL(newUrl);
	}, [file]);

	return <iframe src={url} style={{ width: "100%", height: "100%" }} onLoad={onLoad} onError={onError} />;
};

export default PdfRenderer;
