import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import LogoUploader from "@ext/workspace/components/LogoUploader";
import { FormField } from "@ui-kit/Form";
import { useMemo, useCallback } from "react";
import type { FormData, FormProps } from "../logic/createFormSchema";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { UseFormReturn } from "react-hook-form";

interface UploadCatalogLogoProps {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
}

const UploadCatalogLogo = ({ formProps, form }: UploadCatalogLogoProps) => {
	const {
		deleteLightLogo,
		deleteDarkLogo,
		isLoadingDark,
		isLoadingLight,
		lightLogo,
		darkLogo,
		updateLightLogo,
		updateDarkLogo,
		refreshState,
	} = CatalogLogoService.value();

	useWatchClient(() => {
		void refreshState();
	}, []);

	const defaultLightFileInfo = useMemo(() => {
		if (!lightLogo) return;

		return { name: "logo_light.svg", url: lightLogo };
	}, [isLoadingLight, lightLogo]);

	const defaultDarkFileInfo = useMemo(() => {
		if (!darkLogo) return;

		return { name: "logo_dark.svg", url: darkLogo };
	}, [isLoadingDark, darkLogo]);

	const onError = useCallback(
		(name: "logo.light" | "logo.dark", error: DefaultError) => {
			form.setError(name, { message: error.message });
		},
		[form],
	);

	const onChange = useCallback(
		(name: "logo.light" | "logo.dark") => {
			form.setError(name, { message: null });
		},
		[form],
	);

	return (
		<>
			<FormField
				name="logo.light"
				title={t("file-input.logo-light")}
				description={t("file-input.both-themes-if-no-dark")}
				control={({ fieldState }) => (
					<LogoUploader
						deleteResource={deleteLightLogo}
						updateResource={updateLightLogo}
						defaultFileInfo={defaultLightFileInfo}
						onChange={() => onChange("logo.light")}
						error={fieldState.error?.message}
						onError={(error) => onError("logo.light", error)}
					/>
				)}
				{...formProps}
			/>
			<FormField
				name="logo.dark"
				title={t("file-input.logo-dark")}
				description={t("file-input.dark-theme-only")}
				control={({ fieldState }) => (
					<LogoUploader
						deleteResource={deleteDarkLogo}
						updateResource={updateDarkLogo}
						defaultFileInfo={defaultDarkFileInfo}
						onChange={() => onChange("logo.dark")}
						error={fieldState.error?.message}
						onError={(error) => onError("logo.dark", error)}
					/>
				)}
				{...formProps}
			/>
		</>
	);
};

export default UploadCatalogLogo;
