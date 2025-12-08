import { WorkspaceSettings, ExportTemplate } from "../types/WorkspaceComponent";
import { useRef, useState } from "react";

type TemplateType = "word" | "pdf";

interface UseTemplateManagementProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	templateType: TemplateType;
	maxTemplates: number;
	mimeType: string;
}

export function useTemplateManagement({
	localSettings,
	setLocalSettings,
	templateType,
	maxTemplates,
	mimeType,
}: UseTemplateManagementProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const [pendingDuplicate, setPendingDuplicate] = useState<{
		title: string;
		bufferBase64: string;
		index: number;
	} | null>(null);
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [templateToRename, setTemplateToRename] = useState<string | null>(null);
	const [newTemplateTitle, setNewTemplateTitle] = useState("");

	const getTemplates = (): ExportTemplate[] => {
		return templateType === "word" ? localSettings.wordTemplates ?? [] : localSettings.pdfTemplates ?? [];
	};

	const setTemplates = (templates: ExportTemplate[]) => {
		setLocalSettings((prev) => ({
			...prev,
			[templateType === "word" ? "wordTemplates" : "pdfTemplates"]: templates,
		}));
	};

	const handleTemplateUpload = async (fileList: FileList | null) => {
		if (!fileList) return;
		const files = Array.from(fileList);
		const currentTemplates = getTemplates();

		for (const file of files) {
			const existingIndex = currentTemplates.findIndex((t) => t.title === file.name);
			if (currentTemplates.length >= maxTemplates && existingIndex === -1) break;

			if (existingIndex !== -1) {
				setPendingDuplicate({
					title: file.name,
					bufferBase64: btoa(
						Array.from(new Uint8Array(await file.arrayBuffer()))
							.map((byte) => String.fromCharCode(byte))
							.join(""),
					),
					index: existingIndex,
				});
				setDuplicateDialogOpen(true);
				continue;
			}

			const data = await file.arrayBuffer();
			const bufferBase64 = btoa(
				Array.from(new Uint8Array(data))
					.map((byte) => String.fromCharCode(byte))
					.join(""),
			);
			const template: ExportTemplate = { title: file.name, bufferBase64 };
			setTemplates([...currentTemplates, template]);
		}
	};

	const handleDeleteTemplate = (title: string) => {
		const currentTemplates = getTemplates();
		setTemplates(currentTemplates.filter((t) => t.title !== title));
	};

	const handleReplaceTemplate = () => {
		if (!pendingDuplicate) return;
		const currentTemplates = getTemplates();
		const updated = [...currentTemplates];
		updated[pendingDuplicate.index] = {
			title: pendingDuplicate.title,
			bufferBase64: pendingDuplicate.bufferBase64,
		};
		setTemplates(updated);
		setPendingDuplicate(null);
		setDuplicateDialogOpen(false);
	};

	const openRenameDialog = (templateTitle: string) => {
		setTemplateToRename(templateTitle);
		const base = templateTitle.replace(/\.[^.]+$/, "");
		setNewTemplateTitle(base);
		setRenameDialogOpen(true);
	};

	const handleRenameTemplate = () => {
		if (!templateToRename) return;
		const extMatch = templateToRename.match(/\.[^.]+$/);
		const ext = extMatch ? extMatch[0] : templateType === "word" ? ".docx" : ".pdf";
		const finalTitle = `${newTemplateTitle.trim()}${ext}`;

		const currentTemplates = getTemplates();
		const updated = currentTemplates.map((tpl) =>
			tpl.title === templateToRename ? { ...tpl, title: finalTitle } : tpl,
		);
		setTemplates(updated);
		setRenameDialogOpen(false);
	};

	const downloadTemplate = (template: ExportTemplate) => {
		const data = template.bufferBase64;
		if (!data) return;
		const link = document.createElement("a");
		link.href = `data:${mimeType};base64,${data}`;
		link.download = template.title;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return {
		fileInputRef,
		duplicateDialogOpen,
		setDuplicateDialogOpen,
		pendingDuplicate,
		setPendingDuplicate,
		renameDialogOpen,
		setRenameDialogOpen,
		templateToRename,
		newTemplateTitle,
		setNewTemplateTitle,
		handleTemplateUpload,
		handleDeleteTemplate,
		handleReplaceTemplate,
		openRenameDialog,
		handleRenameTemplate,
		downloadTemplate,
		getTemplates,
	};
}
