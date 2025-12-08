import {
	AuthMethod,
	WorkspaceSettings,
} from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { useScrollContainer } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useEffect, useState } from "react";

const defaultSettings: WorkspaceSettings = {
	name: "",
	source: {
		url: "",
		type: "GitLab",
		repos: null,
	},
	authMethods: [AuthMethod.SSO],
	sections: {},
	wordTemplates: [],
	pdfTemplates: [],
};

export function useWorkspaceSettings() {
	const { settings, updateWorkspace } = useSettings();
	const workspaceSettings = settings?.workspace;
	const [localSettings, setLocalSettings] = useState<WorkspaceSettings>(workspaceSettings || defaultSettings);
	const [isSaving, setIsSaving] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const scrollContainer = useScrollContainer();
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	useEffect(() => {
		if (workspaceSettings) {
			const newSettings: WorkspaceSettings = {
				...defaultSettings,
				...workspaceSettings,
				wordTemplates: workspaceSettings.wordTemplates ?? [],
				pdfTemplates: workspaceSettings.pdfTemplates ?? [],
			};
			setLocalSettings(newSettings);
		}
	}, [workspaceSettings]);

	useEffect(() => {
		if (!scrollContainer) return;

		const handleScroll = () => {
			setIsScrolled(scrollContainer.scrollTop > 0);
		};

		scrollContainer.addEventListener("scroll", handleScroll);
		handleScroll();

		return () => scrollContainer.removeEventListener("scroll", handleScroll);
	}, [scrollContainer]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		if (name === "source.url") {
			setLocalSettings((prev) => ({
				...prev,
				source: { ...prev.source, url: value },
			}));
		} else {
			setLocalSettings((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleAuthMethodChange = (
		selectedLabel: string,
		authOptions: Array<{ label: string; value: AuthMethod[] }>,
	) => {
		const selectedOption = authOptions.find((opt) => opt.label === selectedLabel);
		if (selectedOption) {
			setLocalSettings((prev) => ({
				...prev,
				authMethods: selectedOption.value,
			}));
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateWorkspace(localSettings);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const updateSettings = (updates: Partial<WorkspaceSettings>) => {
		setLocalSettings((prev) => ({ ...prev, ...updates }));
	};

	return {
		localSettings,
		setLocalSettings,
		isSaving,
		isScrolled,
		handleInputChange,
		handleAuthMethodChange,
		handleSave,
		updateSettings,
		saveError,
	};
}
