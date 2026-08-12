import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import t from "@ext/localization/locale/translate";
import type { AppSettingsFormData } from "@ext/settings/logic/formSchema";
import { Divider } from "@ui-kit/Divider";
import { Label } from "@ui-kit/Label";
import { SwitchField } from "@ui-kit/Switch";
import { useFormContext } from "react-hook-form";
import ExportLogsButton from "./ExportLogsButton";
import LogLevelSelect from "./LogLevelSelect";

const DiagnosticsSection = () => {
	const { watch, setValue } = useFormContext<AppSettingsFormData>();
	const consoleOut = watch("logging.console");

	return (
		<SectionContainer>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col items-start justify-between gap-2">
					<Label className="">{t("log-level.title")}</Label>
					<p className="text-sm text-muted-foreground">{t("log-level.description")}</p>
					<LogLevelSelect className="w-full shrink-0" />
				</div>
				<SwitchField
					alignment="left"
					checked={consoleOut !== false}
					className="mt-4"
					description={<>{t("app-settings.diagnostics.logging.console-description")}</>}
					label={t("app-settings.diagnostics.logging.console")}
					onCheckedChange={(value) => setValue("logging.console", value, { shouldDirty: true })}
					size="sm"
				/>
				<Divider className="my-3" />
				<div className="">
					<Label>{t("app-settings.diagnostics.troubleshooting.title")}</Label>
					<p className="text-sm text-muted-foreground ">
						{t("app-settings.diagnostics.troubleshooting.description")}
					</p>
				</div>
				<ExportLogsButton className="w-fit mt-1" endIcon="chevron-down" iconClassName="text-muted" />
			</div>
		</SectionContainer>
	);
};

export default DiagnosticsSection;
