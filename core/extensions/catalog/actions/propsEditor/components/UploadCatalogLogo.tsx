import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { svgToBase64 } from "@core/utils/CustomLogoDriver";
import { cn } from "@core-ui/utils/cn";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type {
	IconPickerColor,
	OnChangeCallback,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { IconPicker } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { useRandomIconPickerValue } from "@ext/markdown/elements/icon/edit/logic/hooks/useRandomIconPickerValue";
import IconComponent from "@ext/markdown/elements/icon/render/components/Icon";
import { InlineTriggerButton } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { SwitchField } from "@ui-kit/Switch";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { FormData, FormProps } from "../logic/createFormSchema";

export type LogoState =
	| { type: "icon"; code: string; color: IconPickerColor }
	| { type: "emoji"; emoji: string }
	| { type: "file"; preview: string; content?: string; file: File | null };

interface UploadCatalogLogoProps {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
}

interface LogoPickerFieldProps {
	state: LogoState;
	onChange: OnChangeCallback;
}

const readFile = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			if (result) resolve(result);
			else reject(new Error("empty"));
		};
		reader.onerror = reject;
		file.type === "image/svg+xml" ? reader.readAsText(file) : reader.readAsDataURL(file);
	});

const TriggerButtonLogo = ({ state }: { state: LogoState }) => {
	if (!state) return <Icon icon="file" />;

	if (state.type === "emoji") return <span className="shrink-0 text-base leading-none">{state.emoji}</span>;
	if (state.type === "icon") return <IconComponent className="shrink-0" code={state.code} color={state.color} />;
	if (state.type === "file") return <img className="shrink-0 h-4 w-4 object-contain" src={state.preview} />;
};

const LogoPickerField = ({ state, onChange }: LogoPickerFieldProps) => {
	const randomLogo = useRandomIconPickerValue(onChange);
	const hasValue = Boolean(state);
	const label = useMemo(() => {
		if (state?.type === "emoji") return "";
		if (state?.type === "icon") return state.code;
		if (state?.type === "file") return "logo.svg";
		return t("file-input.placeholder");
	}, [state]);

	const iconColor = state?.type === "icon" ? state.color : undefined;
	const pickerValue = useMemo(() => {
		if (state?.type === "icon") return { code: state.code as IconCode };
		if (state?.type === "emoji") return { emoji: state.emoji };
		if (state?.type === "file") return { file: state.file };
		return undefined;
	}, [state]);

	return (
		<Popover>
			<PopoverTriggerButton
				className={cn("w-full justify-start pr-2.5 pl-3 py-1.5 font-normal", !hasValue && "text-muted")}
				containerClassName="w-full justify-start"
				variant="outline"
			>
				{state && <TriggerButtonLogo state={state} />}
				<TextOverflowTooltip>{label}</TextOverflowTooltip>
				<div className="flex items-center ml-auto">
					{hasValue ? <InlineTriggerButton className="shrink-0" onClick={() => onChange(null)} /> : null}
					<Tooltip>
						<TooltipContent>{t("pick-random-value")}</TooltipContent>
						<TooltipTrigger asChild>
							<span>
								<InlineTriggerButton className="shrink-0" icon="dices" onClick={randomLogo} />
							</span>
						</TooltipTrigger>
					</Tooltip>
					<span className="text-muted pl-2 shrink-0 aspect-square inline-flex items-center justify-center">
						<Icon icon="chevron-down" />
					</span>
				</div>
			</PopoverTriggerButton>
			<PopoverContent className="p-0 w-auto rounded-xl">
				<IconPicker
					className="max-h-96"
					color={iconColor}
					disableCatalogIcons
					onChange={onChange}
					size="sm"
					value={pickerValue}
				/>
			</PopoverContent>
		</Popover>
	);
};

const UploadCatalogLogo = ({ formProps, form }: UploadCatalogLogoProps) => {
	const darkLogo = form.watch("logo.dark");
	const [useDark, setUseDark] = useState(!!darkLogo);
	const onError = useCallback(
		(name: "logo.light" | "logo.dark", error: DefaultError) => {
			form.setError(name, { message: error.message });
		},
		[form],
	);

	const onClear = useCallback(
		(name: "logo.light" | "logo.dark") => {
			form.clearErrors(name);
		},
		[form],
	);

	useLayoutEffect(() => {
		setUseDark(!!darkLogo);
	}, [darkLogo]);

	const handleFileChange = useCallback(
		async (file: File, name: "logo.light" | "logo.dark") => {
			try {
				const content = await readFile(file);
				const isSvg = file.type === "image/svg+xml";
				const preview = isSvg ? svgToBase64(content) : content;
				form.setValue(name, { type: "file", preview, content, file }, { shouldDirty: true });
				onClear(name);
			} catch {
				onError(name, { message: t("workspace.logo-upload-failed") } as DefaultError);
			}
		},
		[form, onError, onClear],
	);

	const makeChangeHandler = useCallback(
		(name: "logo.light" | "logo.dark"): OnChangeCallback =>
			(props) => {
				if (!props) {
					form.setValue(name, null, { shouldDirty: true });
					onClear(name);
					return;
				}

				if ("code" in props) {
					const color = props.color ?? null;
					form.setValue(name, { type: "icon", code: props.code, color }, { shouldDirty: true });
					onClear(name);
				} else if ("emoji" in props) {
					form.setValue(name, { type: "emoji", emoji: props.emoji }, { shouldDirty: true });
					onClear(name);
				} else if ("file" in props && props.file instanceof File) {
					void handleFileChange(props.file, name);
				}
			},
		[form, handleFileChange, onClear],
	);

	const handleLightChange = makeChangeHandler("logo.light");
	const handleDarkChange = makeChangeHandler("logo.dark");

	return (
		<>
			<FormField
				control={({ field }) => <LogoPickerField onChange={handleLightChange} state={field.value} />}
				description={t("file-input.both-themes-if-no-dark")}
				name="logo.light"
				title={t("workspace.logo")}
				{...formProps}
			/>
			<div className="flex items-center flex-col gap-y-2 !mt-2">
				<SwitchField
					checked={useDark}
					className="w-full"
					label={t("file-input.use-dark-logo")}
					onCheckedChange={(checked) => {
						setUseDark(checked);
						if (!checked) form.setValue("logo.dark", null, { shouldDirty: true });
					}}
					size="sm"
				/>
				<Controller
					control={form.control}
					name="logo.dark"
					render={({ field }) =>
						useDark && <LogoPickerField onChange={handleDarkChange} state={field.value as LogoState} />
					}
				/>
			</div>
		</>
	);
};

export default UploadCatalogLogo;
