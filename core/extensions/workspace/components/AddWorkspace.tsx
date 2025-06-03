import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import CreateWorkspaceForm from "@ext/workspace/components/CreateWorkspaceForm";

const AddWorkspace = () => {
	return (
		<CreateWorkspaceForm
			trigger={<ButtonLink iconViewBox="3 3 18 18" iconCode="plus" text={t("workspace.add")} />}
		/>
	);
};

export default AddWorkspace;
