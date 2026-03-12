import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import type { RendererProps } from "../FilePreview";
import "pdfjs-dist/web/pdf_viewer.css";
import { PDFRenderer } from "@ext/markdown/elements/file/edit/logic/Preview/PDFRenderer";

const Container = styled.div`
	width: 210mm;
	height: 297mm;
	max-height: 95vh;
	justify-self: center;
	overflow: auto;
	display: flex;
	flex-direction: column;
	align-items: center;

	> div:last-of-type {
		margin-bottom: 0;
	}
`;

const PageWrapper = styled.div`
	position: relative;
	margin-bottom: 30px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	background: white;

	.annotationLayer {
		position: absolute;
		left: 0;
		top: 0;
		overflow: hidden;
		pointer-events: none;

		& > * {
			pointer-events: auto;
		}

		& > section,
		& > a {
			position: absolute;
		}
	}
`;

const PageCanvas = styled.canvas`
	display: block;
	max-width: 100%;
`;

const TextLayer = styled.div`
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	overflow: hidden;
	opacity: 0.2;
	line-height: 1;

	& > span {
		color: transparent;
		position: absolute;
		white-space: pre;
		cursor: text;
		transform-origin: 0% 0%;
	}
`;

const PdfRenderer = ({ file, onLoad, onError }: RendererProps) => {
	const [numPages, setNumPages] = useState<number>(0);
	const [isReady, setIsReady] = useState<boolean>(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<PDFRenderer>(null);
	const pageRefs = useRef<
		{
			canvas: HTMLCanvasElement;
			textLayer: HTMLDivElement;
			annotationLayer: HTMLDivElement;
		}[]
	>([]);

	useEffect(() => {
		let renderer: PDFRenderer | undefined;
		const loadDocument = async () => {
			try {
				if (!containerRef.current) return;

				renderer = new PDFRenderer(file, {
					container: containerRef.current,
					pageRefs: pageRefs.current,
				});

				rendererRef.current = renderer;
				const numPages = await renderer.loadDocument();
				setNumPages(numPages);
				setIsReady(true);
			} catch (err) {
				onError?.(err);
			}
		};

		loadDocument();

		return () => {
			renderer?.destroy();
		};
	}, [file, onError]);

	useEffect(() => {
		if (!isReady || !rendererRef.current) return;

		const renderPages = async () => {
			try {
				await rendererRef.current?.render();
				onLoad?.();
			} catch (err) {
				onError?.(err);
			}
		};

		renderPages();
	}, [isReady, onLoad, onError]);

	return (
		<Container ref={containerRef}>
			{Array.from({ length: numPages }, (_, index) => {
				return (
					<PageWrapper key={`page-${index + 1}`}>
						<PageCanvas
							data-page-num={index}
							ref={(el) => {
								if (el && !pageRefs.current[index]?.canvas) {
									if (!pageRefs.current[index])
										pageRefs.current[index] = {
											canvas: undefined,
											textLayer: undefined,
											annotationLayer: undefined,
										};
									pageRefs.current[index].canvas = el;
								}
							}}
						/>
						<TextLayer
							className="textLayer"
							ref={(el) => {
								if (el && !pageRefs.current[index]?.textLayer) {
									if (!pageRefs.current[index])
										pageRefs.current[index] = {
											canvas: undefined,
											textLayer: undefined,
											annotationLayer: undefined,
										};
									pageRefs.current[index].textLayer = el;
								}
							}}
						/>
						<div
							className="annotationLayer"
							ref={(el) => {
								if (el && !pageRefs.current[index]?.annotationLayer) {
									if (!pageRefs.current[index])
										pageRefs.current[index] = {
											canvas: undefined,
											textLayer: undefined,
											annotationLayer: undefined,
										};
									pageRefs.current[index].annotationLayer = el;
								}
							}}
						/>
					</PageWrapper>
				);
			})}
		</Container>
	);
};

export default PdfRenderer;
