import { WorkspaceSettings, WorkspaceTemplate } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { useRef, useState } from "react";

export function useWorkspaceTemplates(
	localSettings: WorkspaceSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>,
) {
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

	const handleTemplateUpload = async (fileList: FileList | null) => {
		if (!fileList) return;
		const files = Array.from(fileList);
		for (const file of files) {
			const existingIndex = (localSettings.wordTemplates ?? []).findIndex((t) => t.title === file.name);
			if ((localSettings.wordTemplates?.length ?? 0) >= 5 && existingIndex === -1) break;

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
			const base64 = btoa(
				Array.from(new Uint8Array(data))
					.map((byte) => String.fromCharCode(byte))
					.join(""),
			);
			setLocalSettings((prev) => ({
				...prev,
				wordTemplates: [...(prev.wordTemplates ?? []), { title: file.name, bufferBase64: base64 }],
			}));
		}
	};

	const handleDeleteTemplate = (title: string) => {
		setLocalSettings((prev) => ({
			...prev,
			wordTemplates: (prev.wordTemplates ?? []).filter((t) => t.title !== title),
		}));
	};

	const handleReplaceTemplate = () => {
		if (!pendingDuplicate) return;
		setLocalSettings((prev) => {
			const current = prev.wordTemplates ?? [];
			const updated = [...current];
			updated[pendingDuplicate.index] = {
				title: pendingDuplicate.title,
				bufferBase64: pendingDuplicate.bufferBase64,
			};
			return { ...prev, wordTemplates: updated };
		});
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
		const ext = extMatch ? extMatch[0] : ".docx";
		const finalTitle = `${newTemplateTitle.trim()}${ext}`;
		setLocalSettings((prev) => {
			const updated = (prev.wordTemplates ?? []).map((tpl) =>
				tpl.title === templateToRename ? { ...tpl, title: finalTitle } : tpl,
			);
			return { ...prev, wordTemplates: updated };
		});
		setRenameDialogOpen(false);
	};

	const downloadTemplate = (template: WorkspaceTemplate) => {
		const link = document.createElement("a");
		link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${template.bufferBase64}`;
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
	};
}
