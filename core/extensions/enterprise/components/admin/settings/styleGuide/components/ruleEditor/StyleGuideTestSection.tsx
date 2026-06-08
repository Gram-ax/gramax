import { DeleteTestDialog } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideDeleteTestDialog";
import { StyleGuideTestExample } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideTestExample";
import {
	useStyleGuideData,
	useStyleGuideUI,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import { generateGuid } from "@ext/enterprise/components/admin/settings/styleGuide/utils/generateGuid";
import t from "@ext/localization/locale/translate";
import { FormSectionHeaderButton, FormSectionTitle, FormStack, FormTitle } from "@ui-kit/Form";
import { useCallback, useState } from "react";
import type { RuleExample } from "../../types";

interface TestSectionProps {
	rule: StyleGuideRule;
}

export const TestSection = ({ rule }: TestSectionProps) => {
	const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
	const { localSettings, setLocalSettings } = useStyleGuideData();
	const { setHasUnsavedChanges } = useStyleGuideUI();

	const model = rule.getModel();

	const actualRule = localSettings[rule.provider].rules.find((r) => r.guid === model.guid);

	const testCases = (actualRule?.testCases ?? []).map((tc, index) => ({
		...tc,
		id: tc.id || `${model.guid}-${index}`,
	}));

	const correctTests = testCases.filter((tc) => tc.isCorrect);
	const incorrectTests = testCases.filter((tc) => !tc.isCorrect);

	const addTestCase = useCallback(
		(isCorrect: boolean) => {
			const newTest: RuleExample = {
				id: generateGuid(),
				isCorrect,
				text: "",
			};

			setLocalSettings((prev) => ({
				...prev,
				[rule.provider]: {
					rules: (prev[rule.provider]?.rules ?? []).map((rule) =>
						rule.guid === model.guid ? { ...rule, testCases: [newTest, ...rule.testCases] } : rule,
					),
				},
			}));
			setHasUnsavedChanges(true);
		},
		[model.guid, rule.provider, setLocalSettings, setHasUnsavedChanges],
	);

	const updateTestCase = useCallback(
		(testId: string, updates: Partial<RuleExample>) => {
			setLocalSettings((prev) => ({
				...prev,
				[rule.provider]: {
					rules: (prev[rule.provider]?.rules ?? []).map((rule) =>
						rule.guid === model.guid
							? {
									...rule,
									testCases: rule.testCases.map((testCase) => {
										const currentId =
											testCase.id || `${model.guid}-${rule.testCases.indexOf(testCase)}`;
										if (currentId !== testId) return testCase;

										const updated = { ...testCase, ...updates };
										if (updates.text !== testCase.text) {
											updated.runResult = undefined;
										}
										return updated;
									}),
								}
							: rule,
					),
				},
			}));
			setHasUnsavedChanges(true);
		},
		[model.guid, rule.provider, setLocalSettings, setHasUnsavedChanges],
	);

	const deleteTestCase = useCallback(
		(testId: string) => {
			setLocalSettings((prev) => ({
				...prev,
				[rule.provider]: {
					rules: (prev[rule.provider]?.rules ?? []).map((rule) =>
						rule.guid === model.guid
							? {
									...rule,
									testCases: rule.testCases.filter(
										(tc) => (tc.id || `${model.guid}-${rule.testCases.indexOf(tc)}`) !== testId,
									),
								}
							: rule,
					),
				},
			}));
			setHasUnsavedChanges(true);
		},
		[model.guid, rule.provider, setLocalSettings, setHasUnsavedChanges],
	);

	return (
		<>
			<FormStack>
				<FormTitle>{t("enterprise.admin.check.tests-title")}</FormTitle>

				<FormStack>
					<div className="flex flex-row items-center justify-between gap-3 lg:gap-4">
						<FormSectionTitle>{t("enterprise.admin.check.tests-correct-section-title")}</FormSectionTitle>
						<FormSectionHeaderButton onClick={() => addTestCase(false)} type="button" variant="text">
							{t("enterprise.admin.check.test-add")}
						</FormSectionHeaderButton>
					</div>
					{incorrectTests.map((test, index) => {
						return (
							<StyleGuideTestExample
								guid={model.guid}
								isFirst={index === 0}
								key={test.id}
								onDelete={setDeleteTestId}
								onUpdate={updateTestCase}
								rule={rule}
								test={test}
							/>
						);
					})}
					<div className="flex flex-row items-center justify-between gap-3 lg:gap-4">
						<FormSectionTitle>{t("enterprise.admin.check.tests-incorrect-section-title")}</FormSectionTitle>
						<FormSectionHeaderButton onClick={() => addTestCase(true)} type="button" variant="text">
							{t("enterprise.admin.check.test-add")}
						</FormSectionHeaderButton>
					</div>
					{correctTests.map((test, index) => {
						return (
							<StyleGuideTestExample
								guid={model.guid}
								isFirst={index === 0}
								key={test.id}
								onDelete={setDeleteTestId}
								onUpdate={updateTestCase}
								rule={rule}
								test={test}
							/>
						);
					})}
				</FormStack>
			</FormStack>
			<DeleteTestDialog
				onConfirm={() => {
					deleteTestCase(deleteTestId!);
					setDeleteTestId(null);
				}}
				onOpenChange={(open) => !open && setDeleteTestId(null)}
				open={Boolean(deleteTestId)}
			/>
		</>
	);
};
