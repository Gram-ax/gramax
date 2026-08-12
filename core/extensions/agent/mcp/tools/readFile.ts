import Path from "@core/FileProvider/Path/Path";
import assert from "assert";
import { agentConfig } from "../../core/agentConfig";
import { MCP_PROMPT_MAP } from "../../prompts/mcpPromptMap";
import { FileConverter, MarkdownDocumentParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { CatalogItemLookup } from "../utils/catalogPaths";

type ReadFileInput = {
	catalogName: string;
	filePath: string;
	headingId?: string;
};

export async function runReadFile({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, filePath, headingId } = input as ReadFileInput;

	try {
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const wmFp = app.wm.current().getFileProvider();
		const normalizedFilePath = CatalogItemLookup.normalizePath(filePath ?? "");
		if (!normalizedFilePath) {
			return fail("filePath is required");
		}
		const resolvedPath = catalog.basePath.join(new Path(normalizedFilePath));
		if (!catalog.basePath.subDirectory(resolvedPath)) {
			return fail("Path resolves outside catalog root");
		}
		const repositoryRelativePath = catalog.getRepositoryRelativePath(resolvedPath).value;
		if (agentConfig.repoExcludedPathPatterns.some((pattern) => pattern.test(repositoryRelativePath))) {
			return fail("Path is excluded by repository access policy");
		}
		if (!(await wmFp.exists(resolvedPath))) {
			return fail("File not found");
		}
		if (await wmFp.isFolder(resolvedPath)) {
			return fail("Target path is a directory");
		}

		const fileName = resolvedPath.nameWithExtension;
		const raw = FileConverter.isBinaryAttachment(fileName)
			? await FileConverter.convertToText(fileName, Uint8Array.from(await wmFp.readAsBinary(resolvedPath)))
			: await wmFp.read(resolvedPath);
		assert(raw != null, "Failed to parse file content");
		const content = headingId ? MarkdownDocumentParser.getHeadingSectionMarkdown(raw, headingId, false) : raw;

		if (content.length > agentConfig.readMaxChars) {
			return ok({
				message: MCP_PROMPT_MAP.readFile.tooLarge,
				headings: MarkdownDocumentParser.getHeadingHierarchy(raw, false),
			});
		}

		return ok({
			catalogName,
			filePath: repositoryRelativePath,
			content,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to read repository file: ${msg}`);
	}
}
