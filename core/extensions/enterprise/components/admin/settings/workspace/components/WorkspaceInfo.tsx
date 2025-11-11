import { Input } from "@ui-kit/Input";
import { SearchSelect } from "@ui-kit/SearchSelect";
import { AuthMethod, AuthOption, WorkspaceSettings } from "../types/WorkspaceComponent";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";

interface WorkspaceInfoProps {
	localSettings: WorkspaceSettings;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	onAuthMethodChange: (selectedLabel: string) => void;
}

const authOptions: AuthOption[] = [
	{ label: "Только Single Sign-On (SSO)", value: [AuthMethod.SSO] },
	{ label: "SSO и Почта (Внешние читатели)", value: [AuthMethod.SSO, AuthMethod.GUEST_MAIL] },
];

const getAuthValueByMethods = (methods: AuthMethod[]): string => {
	return JSON.stringify([...methods].sort());
};

export function WorkspaceInfo({ localSettings, onInputChange, onAuthMethodChange }: WorkspaceInfoProps) {
	return (
		<div>
			<h2 className="text-xl font-medium mb-4">Основная информация</h2>
			<div className="space-y-4">
				<StyledField
					title="Имя рабочего пространства"
					control={() => (
						<Input id="name" name="name" value={localSettings.name} onChange={onInputChange} required />
					)}
				/>
				<StyledField
					title="URL источника (GitLab)"
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
				<StyledField title="Тип источника" control={() => <Input value="GitLab" disabled />} />
				<StyledField
					title="Способ авторизации"
					control={() => (
						<SearchSelect
							options={authOptions.map((option) => ({
								value: JSON.stringify([...option.value].sort()),
								label: option.label,
							}))}
							value={getAuthValueByMethods(localSettings.authMethods || [])}
							onChange={(value) => {
								const option = authOptions.find(
									(opt) => JSON.stringify([...opt.value].sort()) === value,
								);
								if (option) {
									onAuthMethodChange(option.label);
								}
							}}
							placeholder="Выберите способ авторизации"
						/>
					)}
				/>
			</div>
		</div>
	);
}
