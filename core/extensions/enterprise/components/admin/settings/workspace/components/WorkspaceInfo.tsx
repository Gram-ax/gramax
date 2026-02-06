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
							value={localSettings.source.url}
						/>
					)}
					title={t("enterprise.admin.workspace.source-url")}
				/>
				<StyledField
					control={() => <Input disabled value="GitLab" />}
					title={t("enterprise.admin.workspace.source-type")}
				/>
			</div>
		</div>
	);
}
