import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import EditEnterpriseWorkspace from "@ext/enterprise/components/EditEnterpriseWorkspace";
import AddWorkspace from "@ext/workspace/components/AddWorkspace";
import EditWorkspace from "@ext/workspace/components/EditWorkspace";

const SwitchWorkspace = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="layers" text={WorkspaceService.current().name} />}>
			<AddWorkspace />
			<div className="divider" />
			<>
				{WorkspaceService.workspaces().map((workspace) => {
					const { name, path, icon } = workspace;
					const workspaceName = name?.length > 20 ? name.slice(0, 20) + "..." : name;

					return (
						<ButtonLink
							key={path}
							fullWidth
							onClick={() => WorkspaceService.setActive(path, apiUrlCreator)}
							iconCode={icon}
							text={workspaceName}
							rightActions={[
								workspace.enterprise?.gesUrl ? (
									<EditEnterpriseWorkspace key={1} workspace={workspace} />
								) : (
									<EditWorkspace key={0} workspace={workspace} />
								),
							]}
						/>
					);
				})}
			</>
		</PopupMenuLayout>
	);
};

export default SwitchWorkspace;
