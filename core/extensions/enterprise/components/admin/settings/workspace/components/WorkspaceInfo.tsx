import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import t from "@ext/localization/locale/translate";
import { Input } from "@ui-kit/Input";
import type { WorkspaceSettings } from "../types/WorkspaceComponent";

interface WorkspaceInfoProps {
	localSettings: WorkspaceSettings;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const WorkspaceInfoWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<div>
			<h2 className="text-xl font-medium mb-4">{t("enterprise.admin.workspace.main-info")}</h2>
			<div className="space-y-4">{children}</div>
		</div>
	);
};

const WorkspaceNameField = ({ localSettings, onInputChange }: WorkspaceInfoProps) => {
	return (
		<StyledField
			control={() => <Input id="name" name="name" onChange={onInputChange} required value={localSettings.name} />}
			title={t("enterprise.admin.workspace.workspace-name")}
		/>
	);
};

export const WorkspaceInfoDefault = ({ localSettings, onInputChange }: WorkspaceInfoProps) => {
	return (
		<WorkspaceInfoWrapper>
			<WorkspaceNameField localSettings={localSettings} onInputChange={onInputChange} />
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
		</WorkspaceInfoWrapper>
	);
};

export const WorkspaceInfoEnterpriseCloud = ({ localSettings, onInputChange }: WorkspaceInfoProps) => {
	return (
		<WorkspaceInfoWrapper>
			<WorkspaceNameField localSettings={localSettings} onInputChange={onInputChange} />
		</WorkspaceInfoWrapper>
	);
};
