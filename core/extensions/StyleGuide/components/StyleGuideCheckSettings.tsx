import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import Button from "@components/Atoms/Button/Button";
import ChooseFile from "@components/Atoms/ChooseFileButton";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

export interface CheckSettings {
	name: string;
	rules: {
		name: string;
		llmPrompt: string;
		forTypes: string[];
	}[];
}

interface StyleGuideCheckSettingsProps {
	settings: CheckSettings;
	trigger: JSX.Element;
	setSettings: (settings: CheckSettings) => void;
}

const StyleGuideCheckSettings = (props: StyleGuideCheckSettingsProps) => {
	const { settings, trigger, setSettings } = props;
	const [isOpen, setIsOpen] = useState(false);
	const [errorText, setErrorText] = useState<string>(null);
	const [formSettings, setFormSettings] = useState(settings);

	useWatch(() => {
		setFormSettings(settings);
	}, [settings]);

	return (
		<Modal isOpen={isOpen} trigger={trigger} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{t("style-guide.style-guide-settings")}</legend>
						<fieldset>
							<div className="form-group">
								<div className="field field-string row">
									<label className="control-label" style={{ flex: "1" }}>
										{t("style-guide.settings-file")}
										<span className="required">*</span>
									</label>
									<ChooseFile
										errorText={errorText}
										extension=".json"
										fileName={formSettings?.name ?? null}
										onChange={async (file) => {
											setFormSettings({ name: file.name, rules: null });
											try {
												const arrayBuffer = await file.arrayBuffer();
												const json = JSON.parse(Buffer.from(arrayBuffer).toString());
												if (!checkSettingsFileFormat(json)) {
													setErrorText(t("style-guide.invalid-file-format"));
													return;
												}
												setFormSettings({
													name: file.name,
													rules: json,
												});
												setErrorText(null);
											} catch {
												setErrorText(t("style-guide.invalid-file-format"));
											}
										}}
									/>
								</div>
								<div className="input-lable-description" style={{ marginTop: "0.5rem" }}>
									<div className="article" style={{ flex: 1 }}>
										<MinimizedArticleStyled>
											<div
												dangerouslySetInnerHTML={{
													__html: t("style-guide.settings-description"),
												}}
											/>
										</MinimizedArticleStyled>
									</div>
								</div>
							</div>
							<div className="buttons">
								<Button
									disabled={!formSettings}
									onClick={() => {
										setIsOpen(false);
										setSettings(formSettings);
									}}
								>
									<span>{t("save")}</span>
								</Button>
							</div>
						</fieldset>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
};

const checkSettingsFileFormat = (rules: CheckSettings["rules"]) => {
	if (
		rules.some(
			(rule) =>
				typeof rule?.name !== "string" ||
				typeof rule?.llmPrompt !== "string" ||
				!Array.isArray(rule?.forTypes) ||
				rule?.forTypes.some((type) => typeof type !== "string"),
		)
	) {
		return false;
	}
	return true;
};

export default StyleGuideCheckSettings;
