import styled from "@emotion/styled";
import type { RendererProps } from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { FilePreviewError } from "@ext/markdown/elements/file/edit/model/fileErrors";
import type PPTXPreviewer from "pptx-preview/dist/previewer/index";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const PptxContainer = styled.div`
	width: min(95vw, 210mm);
	height: min(85vh, 297mm);
	overflow: hidden;
	justify-self: center;

	.pptx-preview-wrapper {
		margin: unset !important;
		overflow: auto;
		background: transparent;
		padding: unset;
	}
`;

const PptxRenderer = ({ file, onLoad, onError }: RendererProps) => {
	const [pptx, setPptx] = useState<PPTXPreviewer>(null);
	const ref = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	useEffect(() => {
		if (!ref.current) return;

		const preview = async () => {
			const { init: pptxInit } = await import("pptx-preview");
			const rect = ref.current.getBoundingClientRect();
			const pptx = pptxInit(ref.current, { width: rect.width, height: rect.height });

			const buffer = await file.arrayBuffer();
			await pptx.preview(buffer);
			setPptx(pptx);
			onLoad?.();
		};

		try {
			preview();
		} catch (error) {
			onError?.(error);
		}

		return () => {
			if (ref.current) ref.current.innerHTML = "";
			pptx?.destroy();
		};
	}, [file]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		if (!ref.current || !pptx) return;
		if (pptx?.pptx?.slides?.length) return;

		onError?.(new FilePreviewError("We can't display this file", file.name));
	}, [pptx]);

	return <PptxContainer ref={ref} />;
};

export default PptxRenderer;
