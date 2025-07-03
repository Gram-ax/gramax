import { XxHash } from "@core/Hash/Hasher";

interface WordTemplate {
	title: string;
	bufferBase64?: string;
}

export function calcTemplatesHash(templates: WordTemplate[]): number {
	return templates.reduce((acc, { title, bufferBase64 }) => {
		const hasher = XxHash.hasher();
		hasher.hash(title);
		if (bufferBase64) hasher.hash(bufferBase64);
		return acc ^ hasher.finalize();
	}, 0);
}
