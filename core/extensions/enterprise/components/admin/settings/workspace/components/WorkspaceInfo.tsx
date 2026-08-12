import { SettingsSection } from "@ext/enterprise/components/admin/ui-kit/SettingsSection";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import t from "@ext/localization/locale/translate";
import { Input } from "@ui-kit/Input";
import type { WorkspaceSettings } from "../types/WorkspaceComponent";

interface WorkspaceInfoProps {
	localSettings: WorkspaceSettings;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const WorkspaceInfoDefault = ({ localSettings, onInputChange }: WorkspaceInfoProps) => {
	return (
		<SettingsSection contentClassName="space-y-4" title={t("enterprise.admin.workspace.main-info")}>
			<StyledField
				control={() => (
					<Input id="name" name="name" onChange={onInputChange} required value={localSettings.name} />
				)}
				title={t("enterprise.admin.workspace.workspace-name")}
			/>
			<StyledField
				control={() => (
					<Input
						disabled
						id="source.url"
						name="source.url"
						onChange={onInputChange}
						required
						value={localSettings.git.source.url}
					/>
				)}
				title={t("enterprise.admin.workspace.source-url")}
			/>
			<StyledField
				control={() => <Input disabled value="GitLab" />}
				title={t("enterprise.admin.workspace.source-type")}
			/>
		</SettingsSection>
	);
};
