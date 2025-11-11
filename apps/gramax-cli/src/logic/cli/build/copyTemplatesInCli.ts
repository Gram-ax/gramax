import { resolve, join as joinPath, sep as pathSep, basename } from "path";
import fg from "fast-glob";
import Path from "@core/FileProvider/Path/Path";
import ChalkLogger from "../../../utils/ChalkLogger";
import { checkIsFile } from "../utils/paths";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import CliUserError from "../../CliUserError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import { CopyTemplatesFunction } from "../../StaticContentCopier";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";

const GRAMAX_DIR = ".gramax";
const ASSETS_DIR = "assets";
const WORD_SUBDIR = "word";
const PDF_SUBDIR = "pdf";

type TemplateType = "word" | "pdf";
interface GetCopyTemplateOptions {
	fp: DiskFileProvider;
	sourcePath?: string;
	catalogName: string;
}

interface CopyTemplateOptions extends GetCopyTemplateOptions {
	templateType: TemplateType;
}

const toPosix = (p: string) => p.replace(/\\/g, "/");

const logWarnMessage = (str: string) => ChalkLogger.warn(str, { indent: 1 });

const expandDocxCandidates = async (
	input: string,
	fp: DiskFileProvider,
	checkTemplateName: (templateName: string) => boolean,
): Promise<string[]> => {
	const rawParts = input
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const parts = rawParts.length ? rawParts : [input];

	const results = new Set<string>();

	for (const part of parts) {
		const abs = resolve(part);

		try {
			const exists = await fp.exists(new Path(abs));
			if (exists) {
				const isFolder = await fp.isFolder(new Path(abs));
				if (isFolder) {
					const dirPattern = joinPath(abs, "**/*").split(pathSep).join("/");
					const files = await fg(dirPattern, {
						onlyFiles: true,
						caseSensitiveMatch: false,
						unique: true,
						absolute: true,
						markDirectories: false,
						followSymbolicLinks: true,
					});
					for (const f of files) {
						if (checkTemplateName(f)) results.add(f);
					}
				} else {
					if (checkTemplateName(abs)) results.add(abs);
				}
				continue;
			}
		} catch (e) {
			ChalkLogger.log();
			ChalkLogger.error(`treating input as glob due to FS check issue: ${String(e)}`);
			ChalkLogger.log();
		}

		const files = await fg(toPosix(part), {
			cwd: process.cwd(),
			onlyFiles: true,
			caseSensitiveMatch: false,
			unique: true,
			absolute: true,
			followSymbolicLinks: true,
		});
		for (const f of files) {
			if (checkTemplateName(f)) results.add(f);
		}
	}

	return Array.from(results);
};

const getTemplatePaths = async (
	templateType: TemplateType,
	templatePath: string | undefined,
	fp: DiskFileProvider,
): Promise<string[]> => {
	const templateTypeName = templateType === "word" ? "DOCX" : "PDF";

	if (!templatePath || !templatePath.trim()) return [];

	let candidateFiles: string[] = [];
	try {
		const checkTemplateName = (templateName: string) =>
			templateType === "word"
				? WordTemplateManager.isWordTemplateName(templateName)
				: PdfTemplateManager.isPdfTemplateName(templateName);

		candidateFiles = await expandDocxCandidates(templatePath, fp, checkTemplateName);
	} catch (e) {
		throw new CliUserError(`Failed to expand templates from "${templatePath}": ${String(e)}`);
	}

	if (candidateFiles.length === 0) {
		throw new CliUserError(`No ${templateTypeName} templates matched the specified path/glob.`);
	}

	const validTemplates: string[] = [];
	for (const p of candidateFiles) {
		try {
			await checkIsFile(p);
			validTemplates.push(p);
		} catch (e) {
			if ((e as CliUserError).type !== ErrorType.CliUser) {
				throw e;
			}
		}
	}

	if (!validTemplates.length) {
		logWarnMessage("No valid templates found.");
		ChalkLogger.log();
	}

	return validTemplates;
};

const copyTemplatesInCli =
	(options: CopyTemplateOptions): CopyTemplatesFunction =>
	async (copyFile) => {
		const { fp, templateType, sourcePath, catalogName } = options;

		if (!sourcePath) return [];

		const validTemplates = await getTemplatePaths(templateType, sourcePath, fp);
		if (!validTemplates.length) return [];

		const templates: string[] = [];
		const subDir = templateType === "word" ? WORD_SUBDIR : PDF_SUBDIR;
		const templatesDir = new Path([catalogName, GRAMAX_DIR, ASSETS_DIR, subDir]);

		for (const src of validTemplates) {
			try {
				const name = basename(src);
				const dst = templatesDir.join(new Path(name));
				await copyFile(new Path(src), dst);
				templates.push(name);
			} catch (e) {
				new DefaultError(`failed to copy "${src}"`, e);
			}
		}

		const templateTypeName = templateType === "word" ? "DOCX" : "PDF";
		ChalkLogger.log(`Copied ${validTemplates.length} ${templateTypeName} template(s) to build directory.`, {
			indent: 1,
		});
		ChalkLogger.log();

		return templates;
	};

export const copyWordTemplatesInCli = (props: GetCopyTemplateOptions) =>
	copyTemplatesInCli({ ...props, templateType: "word" });

export const copyPdfTemplatesInCli = (props: GetCopyTemplateOptions) =>
	copyTemplatesInCli({ ...props, templateType: "pdf" });
