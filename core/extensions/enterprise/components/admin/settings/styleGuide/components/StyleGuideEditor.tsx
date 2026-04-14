import FileInput from "@components/Atoms/FileInput/FileInput";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Card, CardSubTitle, CardTitle } from "@ui-kit/Card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Label } from "@ui-kit/Label";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { Switch } from "@ui-kit/Switch";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { useState } from "react";
import type { ForType } from "../StyleGuideComponent";

export const getTitle = (xml?: string) => {
	const nameRegex =
		/<(?:rule|rulegroup)(?:\s+[^>]*?)?(?:\s+name="([^"]*)"|\s+id="[^"]*"\s+name="([^"]*)"|\s+name="([^"]*)"\s+id="[^"]*")(?:\s+[^>]*?)?>/;
	const match = (xml ?? "").match(nameRegex);
	if (match) return match[1] || match[2] || match[3] || "";
	return "";
};

const getForTypeOptions = () => {
	const FOR_TYPE_NAMES: Record<ForType, string> = {
		heading: "Только для заголовков",
		plainText: "Только для обычного текста",
	};

	return {
		loadOptions: async () => ({
			options: Object.entries(FOR_TYPE_NAMES).map(([value, label]) => ({
				value,
				label,
			})),
		}),
		getLabel: (forType: ForType) => FOR_TYPE_NAMES[forType] || "",
	};
};

const StyleGuideEditor = ({
	rule,
	provider,
	handleRuleNameChange,
	handleRuleChange,
	handleRuleDelete,
	handleRuleToggle,
	handleTypeChange,
	TestSection,
	isTestRunning,
}) => {
	const [editingRuleTitle, setEditingRuleTitle] = useState(false);
	const forTypeOptions = getForTypeOptions();

	return (
		<Card
			className="mx-4 flex-1 border border-border overflow-auto"
			style={{ display: "flex", flexDirection: "column" }}
		>
			<div className="space-y-3 flex-1">
				<div className="space-y-3">
					<div className="flex justify-between items-center">
						{provider === "llm" && (
							<>
								{editingRuleTitle ? (
									<Input
										autoFocus
										className="text-xl font-semibold flex-1 mr-4"
										disabled={isTestRunning}
										onBlur={() => setEditingRuleTitle(false)}
										onChange={(e) => handleRuleNameChange(e.target.value)}
										placeholder="Название правила"
										value={rule.name}
									/>
								) : (
									<div className="flex items-center gap-2">
										<CardTitle className="text-xl">{rule.name}</CardTitle>
										<Button
											disabled={isTestRunning}
											onClick={() => setEditingRuleTitle(true)}
											size="sm"
											variant="ghost"
										>
											<Icon icon="credit-card" size="md" />
										</Button>
									</div>
								)}
							</>
						)}
						{provider === "lgt" && <CardTitle className="text-xl">{getTitle(rule.xml)}</CardTitle>}
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<Switch
									checked={rule.enabled ?? true}
									id="rule-enabled-switch"
									onCheckedChange={handleRuleToggle}
								/>
								<Label htmlFor="rule-enabled-switch">Активно</Label>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="sm" variant="ghost">
										<Icon icon="more-vertical" size="md" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										className="text-red-500 hover:!text-red-600"
										onClick={handleRuleDelete}
									>
										<Icon className="mr-2" icon="trash-2" size="md" />
										Удалить правило
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<div className="space-y-1">
						{provider === "llm" && (
							<>
								<CardSubTitle>Промпт правила</CardSubTitle>
								<AutogrowTextarea
									className="font-mono"
									disabled={isTestRunning}
									minRows={2}
									onChange={handleRuleChange}
									placeholder="Описание правила для LLM..."
									value={rule.llmPrompt}
								/>
							</>
						)}
						{provider === "lgt" && (
							<>
								<CardSubTitle>{t("enterprise.admin.check.rule")}</CardSubTitle>
								<div className="resize-y border rounded-md overflow-hidden min-h-[156px] h-[300px]">
									<FileInput
										defaultLanguage="xml"
										height="100%"
										key={rule.guid}
										language="xml"
										onChange={handleRuleChange}
										options={{
											automaticLayout: true,
											minimap: { enabled: false },
											lineNumbers: "on",
											scrollBeyondLastLine: false,
											scrollbar: {
												alwaysConsumeMouseWheel: false,
											},
										}}
										style={{ padding: 0 }}
										uiKitTheme
										value={rule.xml}
									/>
								</div>
							</>
						)}
					</div>

					<div className="space-y-1">
						<CardSubTitle>Типы правила</CardSubTitle>
						<MultiSelect
							loadOptions={forTypeOptions.loadOptions}
							onChange={handleTypeChange}
							placeholder="Выберите типы правила..."
							value={(rule.forTypes ?? []).map((typeObj) => ({
								value: typeof typeObj === "string" ? typeObj : typeObj.code,
								label: forTypeOptions.getLabel(typeof typeObj === "string" ? typeObj : typeObj.code),
							}))}
						/>
					</div>

					{TestSection}
				</div>
			</div>
		</Card>
	);
};

export default StyleGuideEditor;
