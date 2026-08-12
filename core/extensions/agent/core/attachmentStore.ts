import Path from "@core/FileProvider/Path/Path";
import assert from "assert";
import { FileConverter } from "../mcp/parser";
import { agentConfig } from "./agentConfig";
import type { AgentFileStore } from "./agentFileStore";

export type AgentAttachment = {
	originalFilename: string;
	itemPath: string;
	size: number;
	mime: string;
};

export type AgentAttachmentInput = {
	name: string;
	mime: string;
	size: number;
	content: string;
	contentEncoding?: "utf-8" | "base64";
};

export class AgentAttachmentStore {
	constructor(private readonly _fileStore: AgentFileStore) {}

	private _getFilePath(sessionId: string, name: string): string {
		const fileName = new Path(name).nameWithExtension.replace(/[/\\]/g, "_");
		return `sessions/${sessionId}/attachments/${fileName}`;
	}

	async put(sessionId: string, attachments: AgentAttachmentInput[]): Promise<AgentAttachment[]> {
		if (!attachments.length) return [];

		const result: AgentAttachment[] = [];
		const writtenPaths: string[] = [];

		try {
			for (const attachment of attachments) {
				AgentAttachmentStore.assertAttachmentExtension(attachment.name);
				const content = await this._adaptAttachmentContent(attachment);

				const relativePath = this._getFilePath(sessionId, attachment.name);
				await this._fileStore.writeFile(relativePath, content);
				writtenPaths.push(relativePath);

				result.push({
					originalFilename: attachment.name,
					itemPath: relativePath,
					size: attachment.size,
					mime: attachment.mime,
				});
			}

			return result;
		} catch (err) {
			await writtenPaths.forEachAsync((path) => this._fileStore.deletePath(path));
			throw err;
		}
	}

	async get(sessionId: string, attachmentName: string): Promise<string | null> {
		return this._fileStore.readFile(this._getFilePath(sessionId, attachmentName));
	}

	static assertAttachmentExtension(filename: string): void {
		const ext = new Path(filename).extension?.toLowerCase() ?? "";
		assert(
			ext && agentConfig.allowedAttachmentExtensions.includes(ext),
			`Unsupported attachment extension: ${ext || "(none)"}`,
		);
	}

	private async _adaptAttachmentContent(attachment: AgentAttachmentInput): Promise<string> {
		const contentEncoding =
			attachment.contentEncoding === "base64" ||
			(!attachment.contentEncoding && FileConverter.isBinaryAttachment(attachment.name))
				? "base64"
				: "utf8";
		const bytes = Uint8Array.from(Buffer.from(attachment.content, contentEncoding));
		const parsed = await FileConverter.convertToText(attachment.name, bytes);
		return parsed ?? attachment.content;
	}
}
