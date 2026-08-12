import { useScrollContainer } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorBadgeText, getGesErrorTitle, getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { useCallback, useEffect, useState } from "react";

const defaultSettings: WorkspaceSettings = {
	name: "",
	git: {
		source: {
			url: "",
			type: "GitLab",
			repos: null,
		},
		lfs: { patterns: [] },
	},
	sections: {},
	wordTemplates: [],
	pdfTemplates: [],
};

export function useWorkspaceSettings() {
	const { settings, gesUrl, update } = useSettings();
	const workspaceSettings = settings?.workspace;
	const [localSettings, setLocalSettings] = useState<WorkspaceSettings>(workspaceSettings || defaultSettings);
	const [isSaving, setIsSaving] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const scrollContainer = useScrollContainer();
	const saveError = useAlertMessage();

	useEffect(() => {
		if (workspaceSettings) {
			const newSettings: WorkspaceSettings = {
				...defaultSettings,
				...workspaceSettings,
				wordTemplates: workspaceSettings.wordTemplates ?? [],
				pdfTemplates: workspaceSettings.pdfTemplates ?? [],
				git: {
					lfs: workspaceSettings.git?.lfs ?? { patterns: [] },
					source: workspaceSettings.git?.source || workspaceSettings.source,
				},
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
				git: { ...prev.git, source: { ...prev.git.source, url: value } },
			}));
		} else {
			setLocalSettings((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleSave = useCallback(async () => {
		saveError.hide();
		setIsSaving(true);
		try {
			await update("workspace", localSettings);
		} catch (e: unknown) {
			const code = toGesErrorCode(e);
			saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
		} finally {
			setIsSaving(false);
		}
	}, [localSettings, update, saveError.hide, saveError.alert, gesUrl]);

	const updateSettings = (updates: Partial<WorkspaceSettings>) => {
		setLocalSettings((prev) => ({ ...prev, ...updates }));
	};

	return {
		localSettings,
		setLocalSettings,
		isSaving,
		isScrolled,
		handleInputChange,
		handleSave,
		updateSettings,
		saveError,
	};
}
