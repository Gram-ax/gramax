import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import t from "@ext/localization/locale/translate";
import { FormField } from "@ui-kit/Form";
import { TextInput } from "@ui-kit/Input";
import { Loader } from "@ui-kit/Loader";

// AI is a workspace-level setting. Writes flow through /api/settings/update,
// where the backend dispatcher routes `services.ai.*` at Level.workspace to the
// per-user cookie store (AiDataProvider) instead of the workspace YAML.
type Props = {
	prefix: string;
	isChecking?: boolean;
	labelClassName?: string;
};

const AiSettingsFields = ({ prefix, isChecking, labelClassName = "w-44" }: Props) => {
	return (
		<SectionContainer>
			<FormField
				control={({ field }) => (
					<TextInput
						{...field}
						endIcon={isChecking ? <Loader size="md" style={{ padding: 0 }} /> : undefined}
						placeholder="https://your-ai-server.com"
						value={field.value ?? ""}
					/>
				)}
				description={t("workspace.ai-server-url-description")}
				labelClassName={labelClassName}
				layout="vertical"
				name={`${prefix}.endpoint`}
				title={t("workspace.ai-server-url")}
			/>
			<FormField
				control={({ field }) => (
					<TextInput {...field} placeholder="your-server-token" type="password" value={field.value ?? ""} />
				)}
				description={t("workspace.ai-server-token-description")}
				labelClassName={labelClassName}
				layout="vertical"
				name={`${prefix}.token`}
				title={t("workspace.ai-server-token")}
			/>
		</SectionContainer>
	);
};

export default AiSettingsFields;
