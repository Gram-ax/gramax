import { agentConfig } from "../../core/agentConfig";
import { MCP_PROMPT_MAP } from "../../prompts/mcpPromptMap";
import { MarkdownDocumentParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type ReadAgentAttachmentInput = {
	attachmentName: string;
	headingId?: string;
};

export async function runReadAgentAttachment({
	app,
	input,
	sessionId,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { attachmentName, headingId } = input as ReadAgentAttachmentInput;

	try {
		const raw = await app.agentManager.attachments.get(sessionId, attachmentName);
		if (raw == null) return fail(`Attachment not found`);

		const content = headingId ? MarkdownDocumentParser.getHeadingSectionMarkdown(raw, headingId) : raw;
		if (content.length > agentConfig.readMaxChars) {
			return ok({
				message: MCP_PROMPT_MAP.readAgentAttachment.tooLarge,
				headings: MarkdownDocumentParser.getHeadingHierarchy(raw),
			});
		}

		return ok({
			attachmentName,
			content,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to read attachment: ${msg}`);
	}
}
