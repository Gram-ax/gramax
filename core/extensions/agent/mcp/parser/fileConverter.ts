import resolveModule from "@app/resolveModule/frontend";
import Path from "@core/FileProvider/Path/Path";
import { agentConfig } from "../../core/agentConfig";

export class FileConverter {
	private constructor() {}

	private static _getFileExtension(fileName: string): string {
		return new Path(fileName).extension?.toLowerCase() ?? "";
	}

	static isBinaryAttachment(fileName: string): boolean {
		const extension = this._getFileExtension(fileName);
		const binaryExtensions = agentConfig.binaryAttachmentExtensions ?? [];
		return !!extension && binaryExtensions.includes(extension);
	}

	static async convertToText(fileName: string, bytes: Uint8Array): Promise<string | null> {
		const extension = this._getFileExtension(fileName);
		switch (extension) {
			case "docx":
				return this._parseDocx(bytes);
			case "xlsx":
				return this._parseXlsx(bytes);
			case "pdf":
				return this._parsePdf(bytes);
			default:
				return null;
		}
	}

	private static async _parseDocx(bytes: Uint8Array): Promise<string> {
		const mammoth = await import("mammoth");
		const arrayBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer;
		const result = await mammoth.extractRawText({ arrayBuffer });
		return result.value.trim();
	}

	private static async _parseXlsx(bytes: Uint8Array): Promise<string> {
		const xlsxLib = await import("@e965/xlsx");
		const workbook = xlsxLib.read(bytes, { type: "array" });
		const sections: string[] = [];
		for (const sheetName of workbook.SheetNames) {
			const worksheet = workbook.Sheets[sheetName];
			if (!worksheet) continue;
			const csv = xlsxLib.utils.sheet_to_csv(worksheet, { blankrows: false }).trim();
			if (!csv) continue;
			sections.push(`# ${sheetName}\n${csv}`);
		}
		return sections.join("\n\n").trim();
	}

	private static async _parsePdf(bytes: Uint8Array): Promise<string> {
		const pdfjs = await resolveModule("getPdfjs")();
		const document = await pdfjs.getDocument({
			data: Uint8Array.from(bytes),
			verbosity: 0,
		}).promise;
		const pages: string[] = [];
		for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex++) {
			const page = await document.getPage(pageIndex);
			const textContent = await page.getTextContent();
			const parts: string[] = [];
			for (const item of textContent.items) {
				if (!("str" in item)) continue;
				parts.push(item.str);
			}
			const text = parts.join(" ").trim();
			if (!text) continue;
			pages.push(text);
		}
		return pages.join("\n\n").trim();
	}
}
