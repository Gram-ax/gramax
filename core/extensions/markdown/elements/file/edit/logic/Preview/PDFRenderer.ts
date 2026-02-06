import pdfjs from "@dynamicImports/pdfjs";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/display/api";

interface PDFRendererRefs {
	container: HTMLDivElement;
	pageRefs: {
		canvas: HTMLCanvasElement;
		textLayer: HTMLDivElement;
		annotationLayer: HTMLDivElement;
		rendered?: boolean;
	}[];
}

type PDFRef = { num: number; gen: number };

type ExplicitDest = [PDFRef, { name: string }, ...number[]];

type Destination = string | ExplicitDest;

export class PDFRenderer {
	private _pdf: PDFDocumentProxy;
	private _pdfjsLib: Awaited<ReturnType<typeof pdfjs>>;
	private _renderingPages = new Map<number, Promise<void>>();
	private _observer: IntersectionObserver = null;
	private _isNavigating = false;

	constructor(
		private readonly file: File,
		private readonly refs: PDFRendererRefs,
	) {}

	async loadDocument() {
		this._pdfjsLib = await pdfjs();

		const arrayBuffer = await this.file.arrayBuffer();
		const loadingTask = this._pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
		this._pdf = await loadingTask.promise;

		return this._pdf.numPages;
	}

	async render() {
		if (!this._pdf) throw new Error("Document not loaded");

		await this._calculatePageDimensions();
		this._applyPageDimensions();

		const initialPages = Math.min(3, this._pdf.numPages);

		for (let pageNum = 1; pageNum <= initialPages; pageNum++) {
			await this._renderPage(pageNum, window.devicePixelRatio || 1);
		}

		this._setupLazyLoading();
	}

	private _pageDimensions: { width: number; height: number }[] = [];

	private async _calculatePageDimensions() {
		const containerWidth = this.refs.container.offsetWidth || 800;

		for (let pageNum = 1; pageNum <= this._pdf.numPages; pageNum++) {
			const page = await this._pdf.getPage(pageNum);
			const viewport = page.getViewport({ scale: 1 });
			const scale = (containerWidth - 40) / viewport.width;
			const scaledViewport = page.getViewport({ scale });

			this._pageDimensions[pageNum - 1] = {
				width: scaledViewport.width,
				height: scaledViewport.height,
			};
		}
	}

	private _applyPageDimensions() {
		this.refs.pageRefs.forEach((pageRef, index) => {
			const dimensions = this._pageDimensions[index];
			if (!dimensions) return;

			pageRef.canvas.style.width = `${dimensions.width}px`;
			pageRef.canvas.style.height = `${dimensions.height}px`;

			pageRef.textLayer.style.width = `${dimensions.width}px`;
			pageRef.textLayer.style.height = `${dimensions.height}px`;

			pageRef.annotationLayer.style.width = `${dimensions.width}px`;
			pageRef.annotationLayer.style.height = `${dimensions.height}px`;
		});
	}

	private async _renderPage(pageNum: number, devicePixelRatio: number): Promise<void> {
		const pageRef = this.refs.pageRefs?.[pageNum - 1];
		if (!pageRef) return;

		if (pageRef.rendered) return;

		if (this._renderingPages.has(pageNum)) {
			return this._renderingPages.get(pageNum);
		}

		const renderPromise = this._doRenderPage(pageNum, devicePixelRatio, pageRef);
		this._renderingPages.set(pageNum, renderPromise);

		try {
			await renderPromise;
		} finally {
			this._renderingPages.delete(pageNum);
		}
	}

	private async _doRenderPage(
		pageNum: number,
		devicePixelRatio: number,
		pageRef: PDFRendererRefs["pageRefs"][number],
	): Promise<void> {
		const page = await this._pdf.getPage(pageNum);
		const containerWidth = this.refs.container.offsetWidth || 800;
		const viewport = page.getViewport({ scale: 1 });
		const scale = (containerWidth - 40) / viewport.width;

		await Promise.all([
			this._renderCanvasLayer(page, pageRef.canvas, scale, devicePixelRatio),
			this._renderTextLayer(page, pageRef.textLayer, scale),
			this._renderAnnotationLayer(page, pageRef.annotationLayer, scale),
		]);

		pageRef.rendered = true;
	}

	private _setupLazyLoading() {
		this._observer = new IntersectionObserver(
			(entries) => {
				if (this._isNavigating) return;

				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;

					const pageNum = parseInt(entry.target.getAttribute("data-page-num") || "0", 10);
					if (!pageNum) return;

					const dpr = window.devicePixelRatio || 1;
					this._renderBatch(pageNum, Math.min(pageNum + 3, this._pdf.numPages), dpr);
				});
			},
			{
				root: null,
				rootMargin: "500% 0px",
				threshold: 0,
			},
		);

		this.refs.pageRefs.forEach((pageRef) => {
			this._observer.observe(pageRef.canvas);
		});
	}

	private async _renderBatch(startPage: number, endPage: number, dpr: number) {
		const promises = [];

		for (let page = startPage; page <= endPage; page++) {
			const pageRef = this.refs.pageRefs[page - 1];
			if (!pageRef || pageRef.rendered) continue;
			promises.push(this._renderPage(page, dpr));
		}

		await Promise.all(promises);
	}

	private async _renderCanvasLayer(
		page: PDFPageProxy,
		canvas: HTMLCanvasElement,
		scale: number,
		devicePixelRatio: number,
	) {
		const scaledViewport = page.getViewport({ scale: scale * devicePixelRatio });
		const context = canvas.getContext("2d");
		if (!context) return;

		canvas.height = scaledViewport.height;
		canvas.width = scaledViewport.width;

		canvas.style.height = `${scaledViewport.height / devicePixelRatio}px`;
		canvas.style.width = `${scaledViewport.width / devicePixelRatio}px`;

		const renderContext = {
			canvasContext: context,
			viewport: scaledViewport,
		};

		await page.render(renderContext).promise;
	}

	private async _renderTextLayer(page: PDFPageProxy, textLayer: HTMLDivElement, scale: number) {
		const { renderTextLayer } = this._pdfjsLib;
		const textLayerViewport = page.getViewport({ scale: scale });
		const textContent = await page.getTextContent();

		textLayer.innerHTML = "";
		textLayer.style.width = `${textLayerViewport.width}px`;
		textLayer.style.height = `${textLayerViewport.height}px`;

		await renderTextLayer({
			textContent: textContent,
			container: textLayer,
			viewport: textLayerViewport,
			textDivs: [],
		}).promise;
	}

	private async _renderAnnotationLayer(page: PDFPageProxy, annotationLayer: HTMLDivElement, scale: number) {
		const { AnnotationLayer: PDFAnnotationLayer } = this._pdfjsLib;
		const textLayerViewport = page.getViewport({ scale: scale });
		const annotations = await page.getAnnotations();

		annotationLayer.innerHTML = "";
		annotationLayer.style.width = `${textLayerViewport.width}px`;
		annotationLayer.style.height = `${textLayerViewport.height}px`;

		if (annotations.length === 0) return;

		const handleInternalLink = this._createInternalLinkHandler();

		PDFAnnotationLayer.render({
			viewport: textLayerViewport.clone({ dontFlip: true }),
			div: annotationLayer,
			annotations: annotations,
			page: page,
			linkService: {
				externalLinkTarget: 2,
				externalLinkEnabled: true,
				getDestinationHash: () => "",
				addLinkAttributes: () => {},
				goToDestination: handleInternalLink,
				navigateTo: handleInternalLink,
			},
			downloadManager: null,
			renderInteractiveForms: false,
			imageResourcesPath: "",
		});

		this._addAnnotationClickHandler(annotationLayer);
	}

	private _createInternalLinkHandler() {
		return async (dest: Destination) => {
			try {
				const pageIndex = await this._resolveDestinationToPageIndex(dest);
				if (pageIndex === null) return;

				await this._navigateToPage(pageIndex);
			} catch (err) {
				console.error("Error navigating to destination:", err);
			}
		};
	}

	private async _resolveDestinationToPageIndex(dest: Destination): Promise<number> {
		const explicitDest = await this._normalizeDestination(dest);
		if (!explicitDest) return null;

		const pageRef = this._extractPageRef(explicitDest);
		if (!pageRef) return null;

		const pageIndex = await this._pdf.getPageIndex(pageRef);
		return typeof pageIndex === "number" ? pageIndex : null;
	}

	private async _normalizeDestination(dest: Destination): Promise<ExplicitDest> {
		if (typeof dest === "string") {
			const resolved = await this._pdf.getDestination(dest);
			return resolved as ExplicitDest;
		}

		if (Array.isArray(dest)) return dest as ExplicitDest;
		return null;
	}

	private _extractPageRef(explicitDest: ExplicitDest): PDFRef {
		if (!Array.isArray(explicitDest) || explicitDest.length === 0) return null;

		const firstElement = explicitDest[0];
		if (this._isPDFRef(firstElement)) return firstElement;
	}

	private _isPDFRef(obj: unknown): obj is PDFRef {
		return typeof obj === "object" && obj !== null && "num" in obj && typeof obj.num === "number";
	}

	private async _navigateToPage(pageIndex: number) {
		const pageWrapper = this.refs.pageRefs[pageIndex];
		if (!pageWrapper) return;

		this._isNavigating = true;

		try {
			const targetPage = pageIndex + 1;
			const dpr = window.devicePixelRatio || 1;

			await this._renderPage(targetPage, dpr);

			await new Promise((resolve) => requestAnimationFrame(resolve));

			pageWrapper.canvas.scrollIntoView({
				behavior: "instant",
				block: "start",
			});
		} finally {
			setTimeout(() => {
				this._isNavigating = false;
			}, 200);
		}
	}

	private _addAnnotationClickHandler(annotationLayer: HTMLDivElement) {
		annotationLayer.addEventListener("click", (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = e.target instanceof HTMLAnchorElement ? e.target : target.closest("a");
			if (anchor && !anchor.href.startsWith("http")) {
				e.preventDefault();
				e.stopPropagation();
			}
		});
	}
}
