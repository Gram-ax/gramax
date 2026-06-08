import { StyleGuideComponentTestButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentTestButton";
import { StyleGuideLgtEditor } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideLgtEditor";
import { StyleGuideLlmEditor } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideLLmEditor";
import { StyleGuideConfirmationDialog } from "@ext/enterprise/components/admin/settings/styleGuide/components/table/StyleGuideConfirmationDialog";
import { StyleGuideRulesTable } from "@ext/enterprise/components/admin/settings/styleGuide/components/table/StyleGuideRulesTable";
import {
	useStyleGuideData,
	useStyleGuideTests,
	useStyleGuideUI,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import {
	LgtRuleAdapter,
	LlmRuleAdapter,
	type StyleGuideRule,
	type StyleGuideRuleProvider,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import { generateGuid } from "@ext/enterprise/components/admin/settings/styleGuide/utils/generateGuid";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import t from "@ext/localization/locale/translate";
import { Button, IconButton, LoadingButtonTemplate } from "@ui-kit/Button";
import { useCallback, useMemo, useRef, useState } from "react";
import type { LgtRule, LlmRule } from "../../types";

function createEmptyRule(provider: StyleGuideRuleProvider, guid: string): LgtRule | LlmRule {
	if (provider === "lgt") {
		return {
			guid,
			xml: `<rule id="" name="${t("enterprise.admin.check.rule-new-name")}"></rule>`,
			forTypes: [],
			enabled: true,
			testCases: [],
		};
	}
	return {
		guid,
		name: t("enterprise.admin.check.rule-new-name"),
		llmPrompt: "",
		enabled: true,
		forTypes: [],
		testCases: [],
	};
}

export function StyleGuideRules() {
	const { localSettings, setLocalSettings, handleSave } = useStyleGuideData();
	const { hasUnsavedChanges, setHasUnsavedChanges } = useStyleGuideUI();
	const { isAnyTestRunning } = useStyleGuideTests();
	const [editingGuid, setEditingGuid] = useState<string | null>(null);
	const [isNewRule, setIsNewRule] = useState(false);
	const [editingDraftRule, setEditingDraftRule] = useState<StyleGuideRule | null>(null);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const shouldCloseAfterSaveRef = useRef(false);

	const lgtRules = useMemo(
		() => localSettings.lgt.rules.map((r) => new LgtRuleAdapter(r)),
		[localSettings.lgt.rules],
	);

	const llmRules = useMemo(
		() => (localSettings.llm?.rules ?? []).map((r) => new LlmRuleAdapter(r)),
		[localSettings.llm?.rules],
	);

	const allRules = useMemo<StyleGuideRule[]>(() => [...lgtRules, ...llmRules], [lgtRules, llmRules]);

	const editingRuleAdapter = useMemo<StyleGuideRule | null>(() => {
		if (!editingGuid) return null;
		return allRules.find((r) => r.getModel().guid === editingGuid) ?? null;
	}, [editingGuid, allRules]);

	const editingRule = editingRuleAdapter;

	const handleEdit = useCallback((guid: string) => {
		setEditingGuid(guid);
		setIsNewRule(false);
	}, []);

	const closeRuleDialog = useCallback(() => {
		setEditingGuid(null);
	}, []);

	const handleCloseSheet = useCallback(() => {
		if (hasUnsavedChanges) {
			setShowUnsavedDialog(true);
			return;
		}
		closeRuleDialog();
	}, [hasUnsavedChanges, closeRuleDialog]);

	const handleAdd = useCallback(
		(provider: StyleGuideRuleProvider) => {
			const newGuid = generateGuid();
			const newRule = createEmptyRule(provider, newGuid);
			setLocalSettings((prev) => ({
				...prev,
				[provider]: {
					rules: [...(prev[provider]?.rules ?? []), newRule],
				},
			}));
			setIsNewRule(true);
			setHasUnsavedChanges(true);
			setEditingGuid(newGuid);
		},
		[setLocalSettings, setHasUnsavedChanges],
	);

	const handleToggle = useCallback(
		(provider: StyleGuideRuleProvider) => async (guid: string, enabled: boolean) => {
			const updated = {
				...localSettings,
				[provider]: {
					rules: (localSettings[provider]?.rules ?? []).map((r) => (r.guid === guid ? { ...r, enabled } : r)),
				},
			};
			await handleSave(updated);
		},
		[localSettings, handleSave],
	);

	const handleDelete = useCallback(
		(provider: StyleGuideRuleProvider) => async (guids: string[]) => {
			const updated = {
				...localSettings,
				[provider]: {
					rules: (localSettings[provider]?.rules ?? []).filter((r) => !guids.includes(r.guid)),
				},
			};
			await handleSave(updated);
		},
		[localSettings, handleSave],
	);

	const handleDiscard = useCallback(() => {
		if (!editingGuid) return;

		if (isNewRule) {
			setLocalSettings((prev) => ({
				...prev,
				lgt: {
					rules: prev.lgt.rules.filter((r) => r.guid !== editingGuid),
				},
				llm: {
					rules: (prev.llm?.rules ?? []).filter((r) => r.guid !== editingGuid),
				},
			}));
		}
		setEditingDraftRule(null);
		setHasUnsavedChanges(false);
		setShowUnsavedDialog(false);
		setEditingGuid(null);
		setIsNewRule(false);
	}, [editingGuid, isNewRule, setLocalSettings, setHasUnsavedChanges]);

	const hasValidTests = useCallback(() => {
		if (!editingRule) return false;
		return editingRule.getModel().testCases.some((tc) => tc.text?.trim());
	}, [editingRule]);

	return (
		<div>
			<div className="flex flex-row gap-6">
				<div className="flex-1">
					<StyleGuideRulesTable
						onAdd={() => handleAdd("lgt")}
						onDelete={handleDelete("lgt")}
						onEdit={handleEdit}
						onToggle={handleToggle("lgt")}
						rules={lgtRules}
						title={t("enterprise.admin.check.rules-lgt-title")}
					/>
				</div>

				<div className="flex-1">
					<StyleGuideRulesTable
						onAdd={() => handleAdd("llm")}
						onDelete={handleDelete("llm")}
						onEdit={handleEdit}
						onToggle={handleToggle("llm")}
						rules={llmRules}
						title={t("enterprise.admin.check.rules-llm-title")}
					/>
				</div>
			</div>

			<SheetComponent
				isOpen={Boolean(editingRule)}
				onOpenChange={(open) => !open && handleCloseSheet()}
				sheetContent={
					editingRule &&
					(editingRule.provider === "lgt" ? (
						<StyleGuideLgtEditor
							allRules={allRules}
							onClose={closeRuleDialog}
							ruleAdapted={editingRule as LgtRuleAdapter}
							setDraftRule={setEditingDraftRule}
							setIsSaving={setIsSaving}
							shouldCloseAfterSaveRef={shouldCloseAfterSaveRef}
						/>
					) : (
						<StyleGuideLlmEditor
							allRules={allRules}
							onClose={closeRuleDialog}
							ruleAdapted={editingRule as LlmRuleAdapter}
							setDraftRule={setEditingDraftRule}
							setIsSaving={setIsSaving}
							shouldCloseAfterSaveRef={shouldCloseAfterSaveRef}
						/>
					))
				}
				showCloseButton={false}
				title={
					editingRule && (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<IconButton icon="x" onClick={handleCloseSheet} variant="ghost" />
								{t("enterprise.admin.check.rule-title")}
							</div>
							<div className="flex items-center gap-2">
								<StyleGuideComponentTestButton
									isUiLocked={isAnyTestRunning || !hasValidTests()}
									rule={editingDraftRule ?? editingRule}
								/>
								{isSaving ? (
									<LoadingButtonTemplate text={t("save2")} />
								) : (
									<Button
										disabled={!hasUnsavedChanges || isSaving}
										form="styleguide-form"
										onClick={() => {
											shouldCloseAfterSaveRef.current = false;
										}}
										type="submit"
									>
										{t("save")}
									</Button>
								)}
							</div>
						</div>
					)
				}
			/>

			<StyleGuideConfirmationDialog
				formId="styleguide-form"
				handleDiscard={handleDiscard}
				isOpen={showUnsavedDialog}
				onClose={closeRuleDialog}
				onOpenChange={setShowUnsavedDialog}
				onSave={() => {
					shouldCloseAfterSaveRef.current = true;
				}}
			/>
		</div>
	);
}
