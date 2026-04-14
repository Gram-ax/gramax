import type { FileValue } from "@ui-kit/FileUpload";
import type { ExportTemplate } from "../types/WorkspaceComponent";

export const WORD_ACCEPT = ".doc,.docx,.docm,.dot,.dotx,.dotm";
export const PDF_ACCEPT = ".css";
export const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "text/css";

export const createFileData = (template: ExportTemplate, mimeType: string) => ({
	name: template.title,
	size: getTemplateSize(template.bufferBase64, mimeType),
	type: mimeType,
});

export const upsertTemplates = (currentTemplates: ExportTemplate[], uploadedTemplates: ExportTemplate[]) => {
	const nextTemplates = [...currentTemplates];

	uploadedTemplates.forEach((template) => {
		const existingIndex = nextTemplates.findIndex((current) => current.title === template.title);

		if (existingIndex !== -1) {
			nextTemplates[existingIndex] = template;
			return;
		}

		nextTemplates.push(template);
	});

	return nextTemplates;
};

export const removeTemplate = (templates: ExportTemplate[], title: string) =>
	templates.filter((template) => template.title !== title);

export const readTemplateFile = async (file: FileValue, readFile: (file: File) => Promise<ExportTemplate>) => {
	if (!(file instanceof File)) {
		return null;
	}

	return readFile(file);
};

export const readWordTemplate = async (file: File) =>
	({
		title: file.name,
		bufferBase64: arrayBufferToBase64(await file.arrayBuffer()),
	}) satisfies ExportTemplate;

export const readPdfTemplate = async (file: File) =>
	({
		title: file.name,
		bufferBase64: await file.text(),
	}) satisfies ExportTemplate;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
	const bytes = new Uint8Array(buffer);
	let binary = "";

	bytes.forEach((byte) => {
		binary += String.fromCharCode(byte);
	});

	return btoa(binary);
};

const getTemplateSize = (data: string, mimeType: string) => {
	if (mimeType === WORD_MIME) {
		return getBase64ByteLength(data);
	}

	return new TextEncoder().encode(data).length;
};

const getBase64ByteLength = (base64: string) => {
	if (!base64) {
		return 0;
	}

	const normalizedBase64 = base64.replace(/\s/g, "");
	const padding = normalizedBase64.endsWith("==") ? 2 : normalizedBase64.endsWith("=") ? 1 : 0;

	return Math.max(0, Math.floor((normalizedBase64.length * 3) / 4 - padding));
};
