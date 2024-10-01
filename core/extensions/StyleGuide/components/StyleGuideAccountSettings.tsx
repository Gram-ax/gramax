import Button from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { StyleGuideChecker } from "gx-ai";
import { GroqLlmModel } from "gx-ai/dist/gpt/llm/groq/groqLlm";
import { LlmApiKey } from "gx-ai/dist/gpt/llm/llm";
import { LlmProvider } from "gx-ai/dist/gpt/llm/llmFactory";
import { useState } from "react";

const Providers = ["OpenAI", "Anthropic"];
const OpenAiModels = ["gpt-4o", "chatgpt-4o-latest", "gpt-4o-mini", "gpt-4o-2024-08-06"];
const AnthropicModels = ["claude-3-5-sonnet-20240620"];

export interface AccountSettings {
	provider: LlmProvider;
	model: GroqLlmModel;
	token: LlmApiKey;
}

interface StyleGuideAccountSettingsProps {
	settings: AccountSettings;
	trigger: JSX.Element;
	setSettings: (settings: AccountSettings) => void;
}

const StyleGuideAccountSettings = (props: StyleGuideAccountSettingsProps) => {
	const { settings, trigger, setSettings } = props;
	const [isOpen, setIsOpen] = useState(false);
	const [formSettings, setFormSettings] = useState(settings);
	const [errorText, setErrorText] = useState(settings?.token ? null : "Введите токен");

	useWatch(() => {
		setFormSettings(settings);
	}, [settings]);

	return (
		<Modal isOpen={isOpen} trigger={trigger} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<ModalLayoutLight>
				<FormStyle fieldDirection="row" formDirection="column">
					<>
						<legend>
							<Icon code="bot" />
							<span>{t("style-guide.set-up-connection")}</span>
						</legend>
						<fieldset>
							<div className="form-group">
								<div className="field field-string row">
									<label className="control-label">
										{"Провайдер LLM"}
										<span className="required">*</span>
									</label>
									<div className="input-lable">
										<ListLayout
											items={Providers}
											item={formSettings?.provider}
											onItemClick={(value) =>
												setFormSettings({
													...formSettings,
													provider: value as LlmProvider,
													model: null,
													token: null,
												})
											}
										/>
									</div>
								</div>
							</div>
							{formSettings?.provider && (
								<>
									<div className="form-group">
										<div className="field field-string row">
											<label className="control-label">
												{"Токен"}
												<span className="required">*</span>
											</label>
											<div className="input-lable">
												<Input
													isCode
													errorText={errorText}
													value={formSettings?.token ?? ""}
													onChange={async (e) => {
														const token = e.target.value;
														setFormSettings({ ...formSettings, token });
														if (!token) return setErrorText("Введите токен");
														setErrorText("Проверяем токен");
														const result = await StyleGuideChecker.isKeyValid({
															provider: formSettings.provider,
															apiKey: token,
														});
														if (!result.isValid) setErrorText("Неверный токен");
														else setErrorText(null);
													}}
												/>
											</div>
										</div>
										<div className="input-lable-description ">
											<div></div>
											<div className="article">
												Ваш токен остается на вашем устройстве и не передается на наши серверы.
												Пожалуйста, храните ваш токен в безопасности и не делитесь им с другими.
											</div>
										</div>
									</div>
									{formSettings?.token && !errorText && (
										<div className="form-group">
											<div className="field field-string row">
												<label className="control-label">
													{"Модель"}
													<span className="required">*</span>
												</label>
												<div className="input-lable">
													<ListLayout
														items={
															formSettings?.provider === "OpenAI"
																? OpenAiModels
																: AnthropicModels
														}
														item={formSettings?.model ?? ""}
														onItemClick={(value) =>
															setFormSettings({
																...formSettings,
																model: value as GroqLlmModel,
															})
														}
													/>
												</div>
											</div>
											<div className="input-lable-description ">
												<div></div>
												<div className="article">
													Если значение не выбрано, то используется рекомендуемая нами модель
													для этого провайдера LLM.
												</div>
											</div>
										</div>
									)}
								</>
							)}
							<div className="buttons">
								<Button
									disabled={!formSettings?.provider || !formSettings?.token || !formSettings?.model}
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

export default StyleGuideAccountSettings;
