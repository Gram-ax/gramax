import { createFormSchema } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import EditStyles from "@ext/workspace/components/EditStyles";
import LogoUploader, { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { Button } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";
import { memo, useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

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

			<FormField
				control={() => (
					<EditStyles customCss={customCss} revertCustomCss={revertCustomCss} setCustomCss={setCustomCss}>
						<Button startIcon="palette" style={{ width: "100%" }} type="button" variant="outline">
							{t("edit2")}
						</Button>
					</EditStyles>
				)}
				description={t("workspace.css-styles-description")}
				name="cssStyles"
				title={t("workspace.css-style")}
				{...formProps}
			/>
		</>
	);
});

export default EditWorkspaceAssets;
