import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { QuestionsList } from "@ext/enterprise/components/admin/settings/quiz/components/QuizQuestionsList";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import t from "@ext/localization/locale/translate";
import { Table } from "@ui-kit/DataTable";
import { Loader } from "@ui-kit/Loader";
import { memo, useEffect, useMemo, useState } from "react";
import { QuizTest, QuizTestData } from "../types/QuizComponentTypes";

interface TestInfoProps {
	table: Table<QuizTest>;
	isOpen: boolean;
	onClose: () => void;
}

export const TestInfo = memo(({ table: parentTable, isOpen, onClose }: TestInfoProps) => {
	const { getQuizDetailedUserAnswers } = useSettings();
	const [data, setData] = useState<QuizTestData>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { row, title } = useMemo(() => {
		if (!parentTable || !isOpen) return { row: null, title: "" };
		const row = parentTable.getSelectedRowModel().rows[0];

		if (!row) return { row: null, title: "" };
		const title = row.original.user_mail;
		return { row, title };
	}, [parentTable, isOpen]);

	useEffect(() => {
		if (!row) return;
		setIsLoading(true);
		getQuizDetailedUserAnswers(row.original.id)
			.then((response) => {
				setData(response);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [row?.original?.id]);

	const onOpenChange = (value: boolean) => {
		if (!value) onClose();
	};

	return (
		<SheetComponent
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			sheetContent={
				<>
					<h4 className="text-xl font-medium">{row?.original?.test_title}</h4>
					{isLoading ? <Loader size="xl">{t("loading")}</Loader> : <QuestionsList data={data} />}
				</>
			}
			title={title}
		/>
	);
});
