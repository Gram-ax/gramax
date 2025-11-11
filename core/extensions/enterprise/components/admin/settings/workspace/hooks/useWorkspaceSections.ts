import { WorkspaceFormData, WorkspaceSettings, WorkspaceView } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { useState } from "react";

export function useWorkspaceSections(
	localSettings: WorkspaceSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>,
) {
	const [showSectionDialog, setShowSectionDialog] = useState(false);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [form, setForm] = useState<WorkspaceFormData>({
		key: "",
		title: "",
		view: WorkspaceView.FOLDER,
		description: "",
		icon: "",
		catalogs: [],
	});
	const [selectedCatalogs, setSelectedCatalogs] = useState<string[]>([]);
	const [originalSectionsOrder, setOriginalSectionsOrder] = useState<string>("");

	const hasSectionsOrderChanged = () => {
		if (!originalSectionsOrder) return false;
		const currentOrder = Object.keys(localSettings.sections || {}).join(",");
		return currentOrder !== originalSectionsOrder;
	};

	const openSectionDialog = (key?: string) => {
		if (key && localSettings.sections[key]) {
			const section = localSettings.sections[key];
			setForm({
				key,
				title: section.title,
				description: section.description || "",
				icon: section.icon || "",
				view: section.view || WorkspaceView.FOLDER,
				catalogs: section.catalogs || [],
			});
			setSelectedCatalogs(section.catalogs || []);
			setEditingKey(key);
		} else {
			setForm({
				key: "",
				title: "",
				description: "",
				icon: "",
				view: WorkspaceView.FOLDER,
				catalogs: [],
			});
			setSelectedCatalogs([]);
			setEditingKey(null);
		}
		setShowSectionDialog(true);
	};

	const handleSaveSection = () => {
		if (!form.key || !form.title) return;

		const alertMessage = `Секция с ключом "${form.key}" уже существует. Пожалуйста, выберите другой ключ.`;

		if (editingKey && editingKey !== form.key) {
			if (localSettings.sections?.[form.key]) {
				alert(alertMessage);
				return;
			}
		} else if (!editingKey) {
			if (localSettings.sections?.[form.key]) {
				alert(alertMessage);
				return;
			}
		}

		setLocalSettings((prev) => {
			const newSections = { ...prev.sections };

			if (editingKey && editingKey !== form.key) {
				delete newSections[editingKey];
			}

			newSections[form.key] = {
				title: form.title,
				description: form.description,
				icon: form.icon,
				catalogs: selectedCatalogs,
				view: form.view,
			};

			return {
				...prev,
				sections: newSections,
			};
		});

		setShowSectionDialog(false);
		resetForm();
	};

	const handleDeleteSection = (key: string) => {
		setLocalSettings((prev) => {
			const newSections = { ...prev.sections };
			delete newSections[key];
			return { ...prev, sections: newSections };
		});
	};

	const resetForm = () => {
		setForm({
			key: "",
			title: "",
			description: "",
			icon: "",
			view: WorkspaceView.FOLDER,
			catalogs: [],
		});
		setSelectedCatalogs([]);
		setEditingKey(null);
	};

	const closeDialog = () => {
		setShowSectionDialog(false);
		resetForm();
	};

	return {
		showSectionDialog,
		setShowSectionDialog,
		editingKey,
		form,
		setForm,
		selectedCatalogs,
		setSelectedCatalogs,
		originalSectionsOrder,
		setOriginalSectionsOrder,
		hasSectionsOrderChanged,
		openSectionDialog,
		handleSaveSection,
		handleDeleteSection,
		resetForm,
		closeDialog,
	};
}
