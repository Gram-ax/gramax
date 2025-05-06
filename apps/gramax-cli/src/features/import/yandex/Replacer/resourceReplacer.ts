import { Resource } from "../entities/article";

export interface ResourceCounter {
	mermaidCounter: number;
	plantUmlCounter: number;
	drawioCounter: number;
}

class ResourceReplacer {
	private readonly _wgridRegex = /{%\s*wgrid\s+id="[^"]+"\s*%}/g;
	private readonly _layoutRegex = /{%\s*layout\b[^%]*%}([\s\S]*?){%\s*endlayout\s*%}/g;
	private readonly _blockRegex = /{%\s*block\b[^%]*%}([\s\S]*?){%\s*endblock\s*%}/g;
	private readonly _drawioRegex = /{%\s*drawio\s+data="data:image\/svg\+xml;base64,([^"]+)"[^%]*%}/g;
	private readonly _mermaidRegex = /```mermaid([\s\S]*?)```/g;
	private readonly _plantUmlRegex = /{% diagram %}\s*([\s\S]*?)\s*{% enddiagram %}/g;

	private readonly _imageRegex = /!\[.*?\]\((.*?)\s*=\s*(\d+)x(\d+)\)/g;
	private readonly _fileRegex = /:file\[(.*?)\]\((.*?)\)(?:\{type="(.*?)"\})?/g;

	constructor() {}

	get counter(): ResourceCounter {
		const internalNames = { mermaidCounter: 0, plantUmlCounter: 0, drawioCounter: 0 };

		return internalNames;
	}

	unsupportedReplace(sourceText: string, url: string) {
		let content = sourceText;

		content = content.replace(
			/{%\s*tasks\s+url="[^"]*"\s*%}/g,
			`[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nTask list are not supported for export\n\`\`\`\n[/unsupported]`,
		);

		content = content.replace(
			/{%\s*toc\s*%}/g,
			`[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nTable of contents are not supported for export\n\`\`\`\n[/unsupported]`,
		);

		content = content.replace(
			/{%\s*forms\s+src="[^"]*"\s*%}/g,
			`[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nYandex.Forms are not supported for export\n\`\`\`\n[/unsupported]`,
		);

		content = content.replace(
			/::: *html[\s\S]*?:::/g,
			`[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nHTML block are not supported for export\n\`\`\`\n[/unsupported]`,
		);

		return content;
	}

	temporarilyUnsupportedReplace(sourceText: string, url: string) {
		let content = sourceText;

		content = content.replace(this._wgridRegex, () => {
			return `[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nDynamic tables are currently not supported for export\n\`\`\`\n[/unsupported]`;
		});

		content = content.replace(this._layoutRegex, () => {
			return `[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nThe article sections are currently not supported for export\n\`\`\`\n[/unsupported]`;
		});

		content = content.replace(this._blockRegex, () => {
			return `[unsupported:yandex.wiki:${url}:warning]\n\`\`\`\nThe text formatting block are currently not supported for export\n\`\`\`\n[/unsupported]`;
		});

		return content;
	}

	fileReplacer(sourceText: string, articleName: string) {
		let content = sourceText;
		const resources: Resource[] = [];

		content = content.replace(this._fileRegex, (_, filename, src) => {
			const item: Resource = { type: "file", slug: "", src, status: "open", is_replaced: true };
			resources.push(item);

			return `[${filename}](./${articleName}-${src.split("/").pop()})`;
		});

		return { content, resources };
	}

	imageReplacer(sourceText: string, articleName: string) {
		let content = sourceText;
		const resources: Resource[] = [];

		content = content.replace(this._imageRegex, (_, src, width, height) => {
			const item: Resource = { type: "image", slug: "", src, status: "open", is_replaced: true };
			resources.push(item);

			return `![](./${articleName}-${src.split("/").pop()}){width=${width}px height=${height}px}`;
		});

		return { content, resources };
	}

	diagramsReplacer(sourceText: string, articleName: string, slug: string) {
		let content = sourceText;
		const counter = this.counter;

		const { resources: DrawIoResources, content: drawioContent } = this.drawioReplacer(
			content,
			counter,
			articleName,
			slug,
		);
		content = drawioContent;

		const { resources: MeramidResources, content: mermaidContent } = this.mermaidReplacer(
			content,
			counter,
			articleName,
			slug,
		);
		content = mermaidContent;

		const { resources: PumlResources, content: pumlContent } = this.pumlReplacer(
			content,
			counter,
			articleName,
			slug,
		);
		content = pumlContent;

		const unionResources: Resource[] = [...DrawIoResources, ...MeramidResources, ...PumlResources];

		return { content, resources: unionResources };
	}

	drawioReplacer(sourceText: string, counter: ResourceCounter, articleName: string, slug: string) {
		let content = sourceText;
		let resources: Resource[] = [];

		content = content.replace(this._drawioRegex, (match, base64Svg) => {
			const diagramName =
				`${articleName}-diagram` + (counter.drawioCounter ? "-" + counter.drawioCounter : "") + ".svg";

			counter.drawioCounter += 1;

			const svgContent = Buffer.from(base64Svg, "base64").toString("utf8");

			const resource: Resource = {
				type: "diagram",
				slug: slug,
				src: diagramName,
				status: "open",
				content: svgContent,
				is_replaced: true,
			};

			resources.push(resource);

			return `[drawio:./${diagramName}]\n`;
		});

		return { content, resources };
	}

	mermaidReplacer(sourceText: string, counter: ResourceCounter, articleName: string, slug: string) {
		let content = sourceText;
		let resources: Resource[] = [];

		content = content.replace(this._mermaidRegex, (match, content) => {
			const diagramName =
				`${articleName}-diagram` + (counter.mermaidCounter ? "-" + counter.mermaidCounter : "") + ".mermaid";

			counter.mermaidCounter += 1;

			const resource: Resource = {
				type: "diagram",
				slug: slug,
				src: diagramName,
				status: "open",
				content: content?.trim(),
				is_replaced: true,
			};

			resources.push(resource);

			return `[mermaid:./${diagramName}]\n`;
		});

		return { content, resources };
	}

	pumlReplacer(sourceText: string, counter: ResourceCounter, articleName: string, slug: string) {
		let content = sourceText;
		let resources: Resource[] = [];

		content = content.replace(this._plantUmlRegex, (match, diagramContent) => {
			const diagramName =
				`${articleName}-diagram` + (counter.plantUmlCounter ? "-" + counter.plantUmlCounter : "") + ".puml";

			counter.plantUmlCounter += 1;

			const resource: Resource = {
				type: "diagram",
				slug: slug,
				src: diagramName,
				status: "open",
				content: diagramContent,
				is_replaced: true,
			};

			resources.push(resource);

			return `[plant-uml:./${diagramName}]`;
		});

		return { content, resources };
	}
}

export default new ResourceReplacer();
