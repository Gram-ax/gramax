import t from "@ext/localization/locale/translate";
import EditStyles from "@ext/workspace/components/EditStyles";
import LogoUploader, { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { Button } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";
import { UseFormReturn } from "react-hook-form";
import { memo, useCallback, useMemo } from "react";
import { z } from "zod";
import { createFormSchema } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";

interface EditWorkspaceAssetsProps {
	lightLogo?: string;
	darkLogo?: string;
	deleteLightLogo?: () => void;
	deleteDarkLogo?: () => void;
	updateLightLogo?: UpdateResource;
	revertCustomCss?: () => void;
	updateDarkLogo?: UpdateResource;
	customCss?: string;
	setCustomCss?: (css: string) => void;
	isLoadingDark?: boolean;
	isLoadingLight?: boolean;
	formProps: Record<string, string>;
	form: UseFormReturn<z.infer<ReturnType<typeof createFormSchema>>>;
}

const EditWorkspaceAssets = memo((props: EditWorkspaceAssetsProps) => {
	const {
		deleteLightLogo,
		deleteDarkLogo,
		updateLightLogo,
		revertCustomCss,
		updateDarkLogo,
		lightLogo,
		darkLogo,
		setCustomCss,
		customCss,
		isLoadingDark,
		isLoadingLight,
		formProps,
		form,
	} = props;

	const defaultLightFileInfo = useMemo(() => {
		if (!lightLogo) return;

		return { name: "logo_for_light.svg", url: lightLogo };
	}, [lightLogo, isLoadingLight]);

	const defaultDarkFileInfo = useMemo(() => {
		if (!darkLogo) return;

		return { name: "logo_for_dark.svg", url: darkLogo };
	}, [isLoadingDark, darkLogo]);

	const onChange = useCallback(
		(name: "logo.light" | "logo.dark") => {
			form.setError(name, { message: null });
		},
		[form],
	);

	const onError = useCallback(
		(name: "logo.light" | "logo.dark", error: DefaultError) => {
			form.setError(name, { message: error.message });
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

			<FormField
				name="cssStyles"
				title={t("workspace.css-style")}
				description={t("workspace.css-styles-description")}
				control={() => (
					<EditStyles revertCustomCss={revertCustomCss} setCustomCss={setCustomCss} customCss={customCss}>
						<Button startIcon="palette" type="button" variant="outline" style={{ width: "100%" }}>
							{t("edit2")}
						</Button>
					</EditStyles>
				)}
				{...formProps}
			/>
		</>
	);
});

export default EditWorkspaceAssets;
