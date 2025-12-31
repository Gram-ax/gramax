import { WorkspaceFormData, WorkspaceSettings, WorkspaceView } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { useCallback, useState } from "react";

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

	const hasSectionsOrderChanged = useCallback(() => {
		if (!originalSectionsOrder) return false;
		const currentOrder = Object.keys(localSettings.sections || {}).join(",");
		return currentOrder !== originalSectionsOrder;
	}, [localSettings.sections, originalSectionsOrder]);

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

	const handleSaveSection = (overrideForm?: WorkspaceFormData, overrideCatalogs?: string[]) => {
		const currentForm = overrideForm || form;
		const currentCatalogs = overrideCatalogs !== undefined ? overrideCatalogs : selectedCatalogs;

		if (!currentForm.key || !currentForm.title) return;

		const alertMessage = `Секция с ключом "${currentForm.key}" уже существует. Пожалуйста, выберите другой ключ.`;

		if (editingKey && editingKey !== currentForm.key) {
			if (localSettings.sections?.[currentForm.key]) {
				alert(alertMessage);
				return;
			}
		} else if (!editingKey) {
			if (localSettings.sections?.[currentForm.key]) {
				alert(alertMessage);
				return;
			}
		}

		setLocalSettings((prev) => {
			const newSections = { ...prev.sections };

			if (editingKey && editingKey !== currentForm.key) {
				delete newSections[editingKey];
			}

			newSections[currentForm.key] = {
				title: currentForm.title,
				description: currentForm.description,
				icon: currentForm.icon,
				catalogs: currentCatalogs,
				view: currentForm.view,
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
