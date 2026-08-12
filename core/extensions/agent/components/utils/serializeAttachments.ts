import { FileConverter } from "@ext/agent/mcp/parser";
import type { AgentDraftAttachment } from "../types/chat";

export const serializeAttachments = async (files: File[]): Promise<AgentDraftAttachment[]> => {
	const result: AgentDraftAttachment[] = [];
	await files.forEachAsync(async (file) => {
		const isBinary = FileConverter.isBinaryAttachment(file.name);
		const content = isBinary
			? Buffer.from(new Uint8Array(await file.arrayBuffer())).toString("base64")
			: await file.text();
		result.push({
			name: file.name,
			mime: file.type || "text/plain",
			size: file.size,
			content,
		});
	});
	return result;
};
