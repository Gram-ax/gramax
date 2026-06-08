import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import LogoUploader from "@ext/workspace/components/LogoUploader";
import { FormField } from "@ui-kit/Form";
import { useCallback, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormData, FormProps } from "../logic/createFormSchema";

interface UploadCatalogLogoProps {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
}

const UploadCatalogLogo = ({ formProps, form }: UploadCatalogLogoProps) => {
	const { lightLogo: initialLightLogo, darkLogo: initialDarkLogo, refreshState } = CatalogLogoService.value();

	const [lightPreview, setLightPreview] = useState<string>(initialLightLogo ?? null);
	const [darkPreview, setDarkPreview] = useState<string>(initialDarkLogo ?? null);

	useWatchClient(() => {
		void refreshState();
	}, []);

	useWatchClient(() => {
		setLightPreview(initialLightLogo ?? null);
		setDarkPreview(initialDarkLogo ?? null);
	}, [initialLightLogo, initialDarkLogo]);

	const defaultLightFileInfo = useMemo(() => {
		if (!lightPreview) return;
		return { name: "logo_light.svg", url: lightPreview };
	}, [lightPreview]);

	const defaultDarkFileInfo = useMemo(() => {
		if (!darkPreview) return;
		return { name: "logo_dark.svg", url: darkPreview };
	}, [darkPreview]);

	const onError = useCallback(
		(name: "logo.light" | "logo.dark", error: DefaultError) => {
			form.setError(name, { message: error.message });
		},
		[form],
	);

	const onChange = useCallback(
		(name: "logo.light" | "logo.dark") => {
			form.clearErrors(name);
		},
		[form],
	);

	const updateLightLogo = useCallback(
		({ content, fileName, type }: { content: string; fileName: string; type: string }) => {
			const base64 = type === "png" ? content : CustomLogoDriver.logoToBase64(content);
			setLightPreview(base64);
			form.setValue("logo.light", { content, fileName, type }, { shouldDirty: true });
			onChange("logo.light");
		},
		[form, onChange],
	);

	const updateDarkLogo = useCallback(
		({ content, fileName, type }: { content: string; fileName: string; type: string }) => {
			const base64 = type === "png" ? content : CustomLogoDriver.logoToBase64(content);
			setDarkPreview(base64);
			form.setValue("logo.dark", { content, fileName, type }, { shouldDirty: true });
			onChange("logo.dark");
		},
		[form, onChange],
	);

	const deleteLightLogo = useCallback(() => {
		setLightPreview(null);
		form.setValue("logo.light", null, { shouldDirty: true });
	}, [form]);

	const deleteDarkLogo = useCallback(() => {
		setDarkPreview(null);
		form.setValue("logo.dark", null, { shouldDirty: true });
	}, [form]);

	return (
		<>
			<FormField
				control={({ fieldState }) => (
					<LogoUploader
						defaultFileInfo={defaultLightFileInfo}
						deleteResource={deleteLightLogo}
						error={fieldState.error?.message}
						key={defaultLightFileInfo?.url ?? "empty-light-logo"}
						onChange={() => onChange("logo.light")}
						onError={(error) => onError("logo.light", error)}
						updateResource={updateLightLogo}
					/>
				)}
				description={t("file-input.both-themes-if-no-dark")}
				name="logo.light"
				title={t("file-input.logo-light")}
				{...formProps}
			/>
			<FormField
				control={({ fieldState }) => (
					<LogoUploader
						defaultFileInfo={defaultDarkFileInfo}
						deleteResource={deleteDarkLogo}
						error={fieldState.error?.message}
						key={defaultDarkFileInfo?.url ?? "empty-dark-logo"}
						onChange={() => onChange("logo.dark")}
						onError={(error) => onError("logo.dark", error)}
						updateResource={updateDarkLogo}
					/>
				)}
				description={t("file-input.dark-theme-only")}
				name="logo.dark"
				title={t("file-input.logo-dark")}
				{...formProps}
			/>
		</>
	);
};

export default UploadCatalogLogo;
