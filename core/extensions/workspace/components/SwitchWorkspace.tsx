import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import AddWorkspace from "@ext/workspace/components/AddWorkspace";
import EditWorkspace from "@ext/workspace/components/EditWorkspace";

const SwitchWorkspace = () => {
	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="layers" text={WorkspaceService.current().name} />}>
			<>
				<AddWorkspace />
				<div className="divider" />
				{WorkspaceService.workspaces().map((workspace, idx) => (
					<ButtonLink
						key={idx}
						fullWidth
						onClick={() => WorkspaceService.setActive(workspace.path)}
						iconCode={workspace.icon}
						text={workspace.name}
						maxLength={20}
						rightActions={[<EditWorkspace key={0} workspace={workspace} />]}
					/>
				))}
			</>
		</PopupMenuLayout>
	);
};

export default SwitchWorkspace;
