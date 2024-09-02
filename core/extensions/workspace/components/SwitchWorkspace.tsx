import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import AddWorkspace from "@ext/workspace/components/AddWorkspace";
import EditWorkspace from "@ext/workspace/components/EditWorkspace";

const SwitchWorkspace = () => {
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
							onClick={() => WorkspaceService.setActive(path)}
							iconCode={icon}
							text={workspaceName}
							rightActions={[<EditWorkspace key={0} workspace={workspace} />]}
						/>
					);
				})}
			</>
		</PopupMenuLayout>
	);
};

export default SwitchWorkspace;
