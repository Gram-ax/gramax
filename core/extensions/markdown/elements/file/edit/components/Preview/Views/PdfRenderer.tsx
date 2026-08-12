import { useEffect, useRef, useState } from "react";
import type { RendererProps } from "../FilePreview";
import "pdfjs-dist/web/pdf_viewer.css";
import { PDFRenderer } from "@ext/markdown/elements/file/edit/logic/Preview/PDFRenderer";

const PdfRenderer = ({ file, onLoad, onError, onMetaChange }: RendererProps) => {
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
				onMetaChange?.({ currentPage: 1, pageCount: numPages });
				setIsReady(true);
			} catch (err) {
				onError?.(err);
			}
		};

		void loadDocument();

		return () => {
			renderer?.destroy();
		};
	}, [file, onError, onMetaChange]);

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

		void renderPages();
	}, [isReady, onLoad, onError]);

	useEffect(() => {
		if (!numPages) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
				if (!visible) return;

				const currentPage = Number((visible.target as HTMLElement).dataset.previewPage);
				if (currentPage) onMetaChange?.({ currentPage });
			},
			{ threshold: [0.25, 0.5, 0.75] },
		);

		pageRefs.current.forEach((pageRef) => {
			if (pageRef?.canvas) observer.observe(pageRef.canvas);
		});

		return () => observer.disconnect();
	}, [numPages, onMetaChange]);

	return (
		<div
			className="flex min-h-full w-[min(100%,210mm)] flex-col items-center justify-self-center overflow-visible"
			ref={containerRef}
		>
			{Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => {
				const index = pageNumber - 1;

				return (
					<div
						className="relative mb-[min(2em,30px)] bg-secondary-bg shadow-soft-xl"
						data-preview-page={pageNumber}
						key={`page-${pageNumber}`}
					>
						<canvas
							className="block max-w-full"
							data-page-num={index}
							data-preview-page={pageNumber}
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
						<div
							className="textLayer absolute inset-0 overflow-hidden opacity-20 leading-none [&>span]:absolute [&>span]:cursor-text [&>span]:whitespace-pre [&>span]:text-transparent [&>span]:[transform-origin:0%_0%]"
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
							className="annotationLayer pointer-events-none absolute left-0 top-0 overflow-hidden [&>*]:pointer-events-auto [&>a]:absolute [&>section]:absolute"
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
					</div>
				);
			})}
		</div>
	);
};

export default PdfRenderer;
