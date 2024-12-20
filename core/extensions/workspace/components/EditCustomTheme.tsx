import { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
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
	} = props;

	const isDev = getIsDevMode();

	if (!isDev) return null;

	return (
		<>
			<h3 className={"second_header"}>{t("workspace.appearance")}</h3>
			<fieldset>
				<FormRowItem className={"assets_row_item"} label={t("workspace.logo")}>
					<div className={"change_logo_actions"}>
						<LogoUploader
							deleteResource={deleteLightLogo}
							updateResource={updateLightLogo}
							logo={lightLogo}
							imageTheme={Theme.light}
						/>
						<div className={"secondary_logo_action"}>
							<span className={"control-label"}>{t("workspace.for-dark-theme-logo")}</span>
							<LogoUploader
								deleteResource={deleteDarkLogo}
								updateResource={updateDarkLogo}
								logo={darkLogo}
								imageTheme={Theme.dark}
							/>
						</div>
					</div>
				</FormRowItem>

				<FormRowItem className={"assets_row_item"} label={t("workspace.css-style")}>
					<EditStyles revertCustomCss={revertCustomCss} setCustomCss={setCustomCss} customCss={customCss}>
						<ButtonLink
							isEmUnits
							unionFontSize
							fullWidth
							iconCode={"palette"}
							textSize={TextSize.S}
							text={t("workspace.edit-css-styles")}
							buttonStyle={ButtonStyle.default}
						/>
					</EditStyles>
				</FormRowItem>
			</fieldset>
		</>
	);
});

const FormRowItem = (props: { children: ReactElement; label: string; className?: string }) => {
	const { children, label, className } = props;

	return (
		<div className={classNames("form-group", {}, [className])}>
			<div className="field field-string row">
				<label className="control-label">{label}</label>
				<div className={`input-lable fullWidth`}>{children}</div>
			</div>
		</div>
	);
};

export default EditWorkspaceAssets;
