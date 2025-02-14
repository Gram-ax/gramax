import Path from "@core/FileProvider/Path/Path";
import ResourceManager from "@core/Resource/ResourceManager";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import Annotation from "@ext/markdown/elements/image/word/imageEditor/Annotation";
import Square from "@ext/markdown/elements/image/word/imageEditor/Square";
import { MAX_WIDTH } from "@ext/pdfExport/config";
import mermaid from "mermaid";
import PlantUmlEncoder from "plantuml-encoder";

export class pdfImageConverter {
	constructor(private resourceManager: ResourceManager) {}

	async convertImagesToBase64(node: Tag): Promise<void> {
		const processImageNode = async (node: Tag): Promise<void> => {
			switch (node.name) {
				case "Image":
					await this._processImageNode(node);
					break;
				case "Drawio":
					await this._processDrawioNode(node);
					break;
				case "Plant-uml":
					await this._processPlantUml(node);
					break;
				case "Mermaid":
					await this._processMermaidNode(node);
					break;
				default:
					if (node.children) {
						await Promise.all(node.children.map(processImageNode));
					}
					break;
			}
		};

		await processImageNode(node);
	}

	public static async convertSvgToBase64(svgString: string): Promise<string> {
		const pngBlob = await pdfImageConverter.svgToPngBlob(svgString, 5);
		const dataUrl = await pdfImageConverter._blobToDataURL(pngBlob);
		return dataUrl;
	}

	private async _processImageNode(node: Tag): Promise<void> {
		if (this._isBase64Image(node.attributes.src)) return;

		const buffer = await this.resourceManager.getContent(new Path(node.attributes.src));
		const blob = new Blob([buffer]);

		const dataUrl = await pdfImageConverter._blobToDataURL(blob);
		const size = await this._getImageSizeFromImageData(dataUrl);
		const croppedDataUrl = await this._cropImage(dataUrl, size, node.attributes.crop);
		const scale = node.attributes.scale || 100;
		const sizeCrop = await this._getImageSizeFromImageData(croppedDataUrl);

		const img = new Image();
		img.src = croppedDataUrl;

		await new Promise<void>((resolve) => {
			img.onload = () => resolve();
		});

		const { newWidth, newHeight } = this._calculateScaledDimensions(
			sizeCrop.width,
			sizeCrop.height,
			scale,
			MAX_WIDTH,
		);

		node.attributes.width = newWidth;
		node.attributes.height = newHeight;

		const updatedDataUrl = pdfImageConverter._addObjectsToImage(
			{ width: newWidth, height: newHeight },
			img,
			croppedDataUrl,
			node.attributes.objects,
		);

		node.attributes.src = updatedDataUrl;
	}

	private _calculateScaledDimensions(
		originalWidth: number,
		originalHeight: number,
		scale: number,
		maxWidth: number,
	): { newWidth: number; newHeight: number } {
		const aspectRatio = originalWidth / originalHeight;

		let newWidth = originalWidth;
		let newHeight = originalHeight;

		if (newWidth > maxWidth) {
			newWidth = maxWidth;
			newHeight = newWidth / aspectRatio;
		}

		newWidth *= scale / 100;
		newHeight *= scale / 100;

		return { newWidth, newHeight };
	}

	private static _addObjectsToImage(
		size: { width: number; height: number },
		image: HTMLImageElement,
		croppedDataUrl: string,
		objects?: ImageObject[],
		maxWidth?: number,
	): string {
		if (!objects) {
			return croppedDataUrl;
		}

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		canvas.width = size.width * 4;
		canvas.height = size.height * 4;
		ctx.scale(4, 4);

		ctx.drawImage(image, 0, 0, size.width, size.height);

		objects.forEach((object, index) => {
			if (object.type === "square") {
				new Square(maxWidth ?? MAX_WIDTH, size.width).draw(
					ctx,
					object,
					(index + 1).toString(),
					size,
					objects.length > 1,
				);
			} else if (object.type === "annotation") {
				new Annotation(maxWidth ?? MAX_WIDTH, size.width).draw(
					ctx,
					object,
					(index + 1).toString(),
					size,
					objects.length > 1,
				);
			}
		});

		return canvas.toDataURL("image/png");
	}

	private async _cropImage(dataUrl: string, size, cropParams: Crop): Promise<string> {
		const { x, y, w, h } = cropParams;
		return new Promise((resolve) => {
			const img = new Image();
			img.src = dataUrl;

			img.onload = () => {
				const canvas = document.createElement("canvas");

				const cropX = (size.width * x) / 100;
				const cropY = (size.height * y) / 100;
				const cropW = (size.width * w) / 100;
				const cropH = (size.height * h) / 100;

				canvas.width = cropW;
				canvas.height = cropH;

				const ctx = canvas.getContext("2d");

				ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

				const croppedDataUrl = canvas.toDataURL();
				resolve(croppedDataUrl);
			};
		});
	}

	private async _getImageSizeFromImageData(imageData: string): Promise<{ width: number; height: number } | null> {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = imageData;
			img.onload = () => {
				resolve({ width: img.width, height: img.height });
			};
		});
	}

	private async _processDrawioNode(node: Tag): Promise<void> {
		if (this._isBase64Image(node.attributes.src)) {
			return;
		}
		const buffer = await this.resourceManager.getContent(new Path(node.attributes.src));

		const svgText = buffer.toString();
		const { width, height } = this._getSvgDimensions(svgText);
		node.attributes.width = width;
		node.attributes.height = height;
		const blob = await pdfImageConverter.svgToPngBlob(svgText, 5);
		const dataUrl = await pdfImageConverter._blobToDataURL(blob);
		if (blob) node.attributes.src = dataUrl;
	}

	private async _processMermaidNode(node: Tag): Promise<void> {
		if (this._isBase64Image(node.attributes.src)) {
			return;
		}
		const buffer = await this.resourceManager.getContent(new Path(node.attributes.src));

		const mermaidText = buffer.toString();
		const { svg, blob } = await this._mermaidToSvgDataURL(mermaidText);

		if (svg) {
			const { width, height } = this._getSvgDimensions(svg);
			const dataUrl = await pdfImageConverter._blobToDataURL(blob);
			node.attributes.src = dataUrl;
			node.attributes.width = width;
			node.attributes.height = height;
		}
		return;
	}

	private _getSvgDimensions(svgText) {
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
		const svgElement = svgDoc.documentElement;

		let width = svgElement.getAttribute("width");
		let height = svgElement.getAttribute("height");

		if (!width || !height) {
			const viewBox = svgElement.getAttribute("viewBox");
			if (viewBox) {
				const viewBoxValues = viewBox.split(" ");
				if (viewBoxValues.length >= 4) {
					width = viewBoxValues[2];
					height = viewBoxValues[3];
				}
			}
		}

		return {
			width: width ? parseFloat(width) : null,
			height: height ? parseFloat(height) : null,
		};
	}

	private async _processPlantUml(node: Tag): Promise<void> {
		if (this._isBase64Image(node.attributes.src)) return;

		const buffer = await this.resourceManager.getContent(new Path(node.attributes.src));
		const pumlText = buffer.toString();
		const encodedDiagram = PlantUmlEncoder.encode(pumlText);
		const url = `https://www.plantuml.com/plantuml/svg/${encodedDiagram}`;
		const response = await fetch(url);
		const svgText = await response.text();
		const { width, height } = this._getSvgDimensions(svgText);
		node.attributes.width = width;
		node.attributes.height = height;
		node.attributes.src = svgText;
	}

	private static _blobToDataURL(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	private static async svgToPngBlob(svg: string, scale: number): Promise<Blob | null> {
		const image = new Image();
		image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

		const canvas = document.createElement("canvas");

		return new Promise((resolve) => {
			image.onload = () => {
				canvas.width = image.width * scale;
				canvas.height = image.height * scale;
				const ctx = canvas.getContext("2d");
				ctx?.drawImage(image, 0, 0, image.width * scale, image.height * scale);
				canvas.toBlob(resolve);
			};
		});
	}

	private async _mermaidToSvgDataURL(mermaidText: string): Promise<{ svg: string; blob: Blob | null }> {
		const mermaidDiv = document.createElement("div");
		mermaidDiv.id = `mermaid-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		document.body.appendChild(mermaidDiv);

		try {
			const uniqueId = `mermaidGraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			const result = await mermaid.render(uniqueId, mermaidText, mermaidDiv);
			const blob = await pdfImageConverter.svgToPngBlob(result.svg, 6);
			return { svg: result.svg, blob };
		} catch {
			return null;
		} finally {
			document.body.removeChild(mermaidDiv);
		}
	}

	private _isBase64Image(src: string): boolean {
		return src.startsWith("data:image/png;base64,") || src.startsWith("data:image/svg+xml;base64,");
	}
}
