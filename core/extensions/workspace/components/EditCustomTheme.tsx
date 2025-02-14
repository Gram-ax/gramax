import { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";
import EditStyles from "@ext/workspace/components/EditStyles";
import LogoUploader from "@ext/workspace/components/LogoUploader";
import { ReactElement, memo } from "react";

interface EditWorkspaceAssetsProps {
	lightLogo?: string;
	darkLogo?: string;
	deleteLightLogo?: () => void;
	deleteDarkLogo?: () => void;
	updateLightLogo?: (data: string) => void;
	revertCustomCss?: () => void;
	updateDarkLogo?: (data: string) => void;
	customCss?: string;
	setCustomCss?: (css: string) => void;
	isLoadingDark?: boolean;
	isLoadingLight?: boolean;
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
	} = props;

	return (
		<>
			<h3 className={"second_header"}>{t("workspace.appearance")}</h3>
			<fieldset>
				<FormRowItem
					className={"assets_row_item inverseMargin"}
					label={t("workspace.logo")}
					description={t("workspace.default-logo-description")}
				>
					<div className={"change_logo_actions"}>
						<LogoUploader
							deleteResource={deleteLightLogo}
							updateResource={updateLightLogo}
							logo={lightLogo}
							isLoading={isLoadingLight}
							imageTheme={Theme.light}
						/>
					</div>
				</FormRowItem>

				<FormRowItem className={"assets_row_item"} description={t("workspace.dark-logo-description")}>
					<div className={"secondary_logo_action"}>
						<span className={"control-label"}>{t("workspace.for-dark-theme")}</span>
						<LogoUploader
							deleteResource={deleteDarkLogo}
							updateResource={updateDarkLogo}
							logo={darkLogo}
							isLoading={isLoadingDark}
							imageTheme={Theme.dark}
						/>
					</div>
				</FormRowItem>

				<FormRowItem
					className={"assets_row_item"}
					label={t("workspace.css-style")}
					description={t("workspace.css-styles-description")}
				>
					<EditStyles revertCustomCss={revertCustomCss} setCustomCss={setCustomCss} customCss={customCss}>
						<ButtonLink
							isEmUnits
							unionFontSize
							fullWidth
							iconCode={"palette"}
							textSize={TextSize.S}
							text={t("edit2")}
							buttonStyle={ButtonStyle.default}
						/>
					</EditStyles>
				</FormRowItem>
			</fieldset>
		</>
	);
});

const FormRowItem = (props: { children: ReactElement; label?: string; className?: string; description?: string }) => {
	const { children, description, label, className } = props;

	return (
		<div className={classNames("form-group", {}, [className])}>
			<div className="field field-string row">
				<label className="control-label">{label}</label>
				<div className={`input-lable fullWidth`}>{children}</div>
			</div>
			{description && (
				<div className="input-lable-description ">
					<div></div>
					<div className="article">{description}</div>
				</div>
			)}
		</div>
	);
};

export default EditWorkspaceAssets;
