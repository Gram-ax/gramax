import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import t from "@ext/localization/locale/translate";
import { Input } from "@ui-kit/Input";
import { WorkspaceSettings } from "../types/WorkspaceComponent";

interface WorkspaceInfoProps {
	localSettings: WorkspaceSettings;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function WorkspaceInfo({ localSettings, onInputChange }: WorkspaceInfoProps) {
	return (
		<div>
			<h2 className="text-xl font-medium mb-4">Основная информация</h2>
			<div className="space-y-4">
				<StyledField
					title={t("enterprise.admin.workspace.workspace-name")}
					control={() => (
						<Input id="name" name="name" value={localSettings.name} onChange={onInputChange} required />
					)}
				/>
				<StyledField
					title={t("enterprise.admin.workspace.source-url")}
					control={() => (
						<Input
							id="source.url"
							name="source.url"
							value={localSettings.source.url}
							onChange={onInputChange}
							required
							disabled
						/>
					)}
				/>
				<StyledField
					title={t("enterprise.admin.workspace.source-type")}
					control={() => <Input value="GitLab" disabled />}
				/>
			</div>
		</div>
	);
}
