import Button from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { ListItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { StyleGuideChecker } from "@ics/gx-ai";
import type { GroqLlmModel } from "@ics/gx-ai/dist/llm/groq/groqLlm";
import type { LlmApiKey } from "@ics/gx-ai/dist/llm/llm";
import type { LlmProviderName } from "@ics/gx-ai/dist/llm/llmFactory";
import { useEffect, useState } from "react";

export interface AccountSettings {
	provider: LlmProviderName;
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
	const [errorText, setErrorText] = useState<string>(null);

	const [providers, setProviders] = useState<LlmProviderName[]>([]);
	const [models, setModels] = useState<{ [key: string]: ListItem[] }>();

	useWatch(() => {
		setFormSettings(settings);
	}, [settings]);

	useWatch(() => {
		if (!formSettings?.provider || !models?.[formSettings?.provider] || formSettings.model) return;
		setFormSettings({
			...formSettings,
			model: (models?.[formSettings?.provider]?.[0]?.value as GroqLlmModel) ?? null,
		});
	}, [models, formSettings?.provider]);

	const loadProviders = async () => {
		const providers = (await StyleGuideChecker.getAvailableProviders()).map((provider) => provider.name);
		const models = {};
		await Promise.all(
			providers.map(async (provider) => {
				const m: ListItem[] = (await StyleGuideChecker.getModelsByProvider(provider)).map((m, i) => ({
					element: i === 0 ? m.name + ` (${t("style-guide.recommended")})` : m.name,
					value: m.name,
				}));
				models[provider] = m;
			}),
		);
		setProviders(providers);
		setModels(models);
	};

	useEffect(() => {
		loadProviders();
	}, []);

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
										{t("style-guide.LLM-provider")}
										<span className="required">*</span>
									</label>
									<div className="input-lable">
										<ListLayout
											items={providers}
											item={formSettings?.provider}
											onItemClick={(value) =>
												setFormSettings({
													...formSettings,
													provider: value as LlmProviderName,
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
									<div className="separator" />
									<div className="form-group">
										<div className="field field-string row">
											<label className="control-label">
												{t("token")}
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
														if (!token) return setErrorText(t("style-guide.enter-token"));
														setErrorText(t("style-guide.verifying-token"));
														const result = await StyleGuideChecker.isKeyValid({
															provider: formSettings.provider,
															apiKey: token,
														});
														if (!result.isValid)
															setErrorText(t("style-guide.invalid-token"));
														else setErrorText(null);
													}}
												/>
											</div>
										</div>
										<div className="input-lable-description">
											<div></div>
											<div className="article">{t("style-guide.token-descriprion")}</div>
										</div>
									</div>
									{formSettings?.token && !errorText && (
										<div className="form-group">
											<div className="field field-string row">
												<label className="control-label">
													{t("model")}
													<span className="required">*</span>
												</label>
												<div className="input-lable">
													<ListLayout
														items={models?.[formSettings.provider] ?? []}
														item={
															models?.[formSettings.provider]?.find(
																(m) => m.value === formSettings?.model,
															) ??
															models?.[formSettings.provider]?.[0] ??
															""
														}
														onItemClick={(_, __, idx) =>
															setFormSettings({
																...formSettings,
																model: models?.[formSettings.provider]?.[idx]
																	.value as GroqLlmModel,
															})
														}
													/>
												</div>
											</div>
										</div>
									)}
								</>
							)}
							<div className="buttons">
								<Button
									disabled={
										!formSettings?.provider ||
										!formSettings?.token ||
										!formSettings?.model ||
										!!errorText
									}
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
