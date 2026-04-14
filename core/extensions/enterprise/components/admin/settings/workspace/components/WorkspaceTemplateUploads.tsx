import t from "@ext/localization/locale/translate";
import { Description } from "@ui-kit/Description";
import { FileUploadCompact, type FileValue } from "@ui-kit/FileUpload";
import { type Dispatch, type SetStateAction, useCallback, useMemo } from "react";
import type { ExportTemplate, WorkspaceSettings } from "../types/WorkspaceComponent";
import {
	createFileData,
	PDF_ACCEPT,
	PDF_MIME,
	readPdfTemplate,
	readTemplateFile,
	readWordTemplate,
	removeTemplate,
	upsertTemplates,
	WORD_ACCEPT,
	WORD_MIME,
} from "./TemplateUploadUtils";

interface WorkspaceTemplateUploadsProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: Dispatch<SetStateAction<WorkspaceSettings>>;
}

interface TemplateUploadProps extends WorkspaceTemplateUploadsProps {
	title: string;
	description: string;
	accept: string;
	mimeType: string;
	getTemplates: (settings: WorkspaceSettings) => ExportTemplate[];
	setTemplates: (settings: WorkspaceSettings, templates: ExportTemplate[]) => WorkspaceSettings;
	readFile: (file: File) => Promise<ExportTemplate>;
}

export function WorkspaceTemplateUploads(props: WorkspaceTemplateUploadsProps) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-xl font-medium">{t("enterprise.admin.workspace.templates.title")}</h2>
			</div>
			<Description>{t("enterprise.admin.workspace.templates.description")}</Description>

			<div className="grid grid-cols-2 gap-2">
				<WordTemplateUpload {...props} />
				<PdfTemplateUpload {...props} />
			</div>
		</div>
	);
}

function WordTemplateUpload(props: WorkspaceTemplateUploadsProps) {
	return (
		<TemplateUpload
			{...props}
			accept={WORD_ACCEPT}
			description={t("enterprise.admin.workspace.templates.word.description")}
			getTemplates={(settings) => settings.wordTemplates ?? []}
			mimeType={WORD_MIME}
			readFile={readWordTemplate}
			setTemplates={(settings, templates) => ({ ...settings, wordTemplates: templates })}
			title={t("enterprise.admin.workspace.templates.word.title")}
		/>
	);
}

function PdfTemplateUpload(props: WorkspaceTemplateUploadsProps) {
	return (
		<TemplateUpload
			{...props}
			accept={PDF_ACCEPT}
			description={t("enterprise.admin.workspace.templates.pdf.description")}
			getTemplates={(settings) => settings.pdfTemplates ?? []}
			mimeType={PDF_MIME}
			readFile={readPdfTemplate}
			setTemplates={(settings, templates) => ({ ...settings, pdfTemplates: templates })}
			title={t("enterprise.admin.workspace.templates.pdf.title")}
		/>
	);
}

function TemplateUpload({
	localSettings,
	setLocalSettings,
	title,
	description,
	accept,
	mimeType,
	getTemplates,
	setTemplates,
	readFile,
}: TemplateUploadProps) {
	const files = useMemo(
		() => getTemplates(localSettings).map((template) => createFileData(template, mimeType)),
		[getTemplates, localSettings, mimeType],
	);

	const handleAdd = useCallback(
		async (filesToAdd: FileValue[]) => {
			const uploadedTemplates = (
				await Promise.all(filesToAdd.map((file) => readTemplateFile(file, readFile)))
			).filter((template): template is ExportTemplate => template !== null);

			if (!uploadedTemplates.length) {
				return;
			}

			setLocalSettings((prev) => setTemplates(prev, upsertTemplates(getTemplates(prev), uploadedTemplates)));
		},
		[getTemplates, readFile, setLocalSettings, setTemplates],
	);

	const handleRemove = useCallback(
		(file: FileValue) => {
			setLocalSettings((prev) => setTemplates(prev, removeTemplate(getTemplates(prev), file.name)));
		},
		[getTemplates, setLocalSettings, setTemplates],
	);

	return (
		<FileUploadCompact
			accept={accept}
			description={description}
			files={files}
			multiple
			onAdd={handleAdd}
			onRemove={handleRemove}
			title={title}
		/>
	);
}
