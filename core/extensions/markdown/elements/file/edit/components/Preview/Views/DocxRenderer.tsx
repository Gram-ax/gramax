import styled from "@emotion/styled";
import { useCallback, useEffect, useRef } from "react";
import type { RendererProps } from "../FilePreview";

const DocxContainer = styled.div`
	width: min(95vw, 210mm);
	height: min(85vh, 297mm);
	overflow: auto;
	justify-self: center;

	.docx-wrapper {
		background: transparent;
		padding: unset;
	}

	.docx-wrapper section:last-of-type {
		margin-bottom: 0;
	}
`;

const DocxRenderer = ({ file, onLoad, onError }: RendererProps) => {
	const ref = useRef<HTMLDivElement>(null);

	const render = useCallback(
		async (file: File) => {
			if (!ref.current) return;
			try {
				const { renderAsync } = await import("docx-preview");
				await renderAsync(file, ref.current);
			} catch (error) {
				onError?.(error);
			} finally {
				onLoad?.();
			}
		},
		[onLoad, onError],
	);

	useEffect(() => {
		if (!ref.current) return;
		if (file) render(file);
	}, [file, render]);

	return <DocxContainer ref={ref} />;
};

export default DocxRenderer;
