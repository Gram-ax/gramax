import { XxHash } from "@core/Hash/Hasher";
import { ExportTemplate } from "@ext/enterprise/types/UserSettings";

export function calcTemplatesHash(templates: ExportTemplate[]): number {
	return templates.reduce((acc, { title, bufferBase64 }) => {
		const hasher = XxHash.hasher();
		hasher.hash(title);
		if (bufferBase64) hasher.hash(bufferBase64);
		return acc ^ hasher.finalize();
	}, 0);
}
