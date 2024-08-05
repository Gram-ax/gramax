import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import openChat from "../../integrations/telegram/openChat";

const BugReport = () => {
	// const isEdit = IsEditService.value;
	// const editor = EditorService.getEditor();
	// const version = PageDataContextService.value.version;

	return (
		<li data-qa="qa-clickable">
			<a
				onClick={async () => {
					// const hash = Hash(new Date());
					// const event = await sendBug(new Error("Пользовательская ошибка"), (error) => {
					// 	error.addFeatureFlag("env", getExecutingEnvironment());
					// 	if (hash) error.addMetadata("hash", { hash });
					// 	if (!editor) return;
					// 	const lastActions = getLastNActions(editor, 5);
					// 	if (isEdit) error.addMetadata("editor", { content: editor.getJSON(), lastActions });
					// });
					// await createIssue(version, event ? hash : "");
					await openChat();
				}}
			>
				<div>
					<Icon code={"bug"} />
					<span>{t("bug-report.name")}</span>
				</div>
			</a>
		</li>
	);
};

export default BugReport;
