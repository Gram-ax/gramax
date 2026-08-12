import t from "@ext/localization/locale/translate";
import { Level } from "@ext/loggers/opentelemetry";
import type { AppSettingsFormData } from "@ext/settings/logic/formSchema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useFormContext } from "react-hook-form";

const LEVELS: { level: Level; labelKey: Parameters<typeof t>[0]; descKey: Parameters<typeof t>[0] }[] = [
	{ level: Level.Off, labelKey: "log-level.off", descKey: "log-level.desc.off" },
	{ level: Level.Commands, labelKey: "log-level.commands", descKey: "log-level.desc.commands" },
	{ level: Level.Important, labelKey: "log-level.important", descKey: "log-level.desc.important" },
	{ level: Level.Internal, labelKey: "log-level.internal", descKey: "log-level.desc.internal" },
	{ level: Level.Files, labelKey: "log-level.files", descKey: "log-level.desc.files" },
	{ level: Level.Full, labelKey: "log-level.full", descKey: "log-level.desc.full" },
];

const LogLevelSelect = ({ className, disabled }: { className?: string; disabled?: boolean }) => {
	const { watch, setValue } = useFormContext<AppSettingsFormData>();
	const level = watch("logging.level");
	const current = Object.values(Level).includes(level) ? level : Level.Important;

	return (
		<Select
			onValueChange={(value) => setValue("logging.level", value as Level, { shouldDirty: true })}
			value={current}
		>
			{/* Radix mirrors the selected ItemText into the trigger — show only the level name there. */}
			<SelectTrigger
				aria-label={t("log-level.title")}
				className={`[&_[data-level-desc]]:hidden ${className ?? ""}`}
				disabled={disabled}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{LEVELS.map(({ level, labelKey, descKey }) => (
					<SelectItem key={level} value={level}>
						<span className="flex flex-col items-start">
							<span>{t(labelKey)}</span>
							<span className="text-xs text-muted-foreground" data-level-desc>
								{t(descKey)}
							</span>
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default LogLevelSelect;
