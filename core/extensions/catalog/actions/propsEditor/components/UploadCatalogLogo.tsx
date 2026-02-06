import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import LogoUploader from "@ext/workspace/components/LogoUploader";
import { FormField } from "@ui-kit/Form";
import { useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import type { FormData, FormProps } from "../logic/createFormSchema";

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
				control={({ fieldState }) => (
					<LogoUploader
						defaultFileInfo={defaultLightFileInfo}
						deleteResource={deleteLightLogo}
						error={fieldState.error?.message}
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
