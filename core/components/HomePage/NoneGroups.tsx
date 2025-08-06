import resolveModule from "@app/resolveModule/frontend";
import Welcome from "@components/Welcome";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import Mode from "@ext/git/actions/Clone/model/Mode";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission, editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { type HTMLAttributes } from "react";
import CreateCatalog from "../../extensions/catalog/actions/CreateCatalog";
import Clone from "../../extensions/git/actions/Clone/components/Clone";
import Button from "../Atoms/Button/Button";
import Icon from "../Atoms/Icon";

const NoneGroups = (props: HTMLAttributes<HTMLDivElement>) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const hasWorkspace = !!PageDataContextService.value.workspace.current;
	const workspacePath = WorkspaceService?.current()?.path;
	const { isStatic } = usePlatform();

	const canEditCatalog = workspacePath
		? PermissionService.useCheckPermission(editCatalogPermission, workspacePath)
		: true;
	const canConfigureWorkspace = workspacePath
		? PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath)
		: true;
	const canAddCatalog = (() => {
		if (isStatic) return false;
		return (isReadOnly && canConfigureWorkspace) || (!isReadOnly && canEditCatalog);
	})();

	return (
		<div {...props}>
			<Welcome
				title={t("so-far-its-empty")}
				body={
					isReadOnly ? (
						<p>{t("catalog.get-started.docportal")}</p>
					) : (
						<>
							<p>{t("catalog.get-started.editor")}</p>
							<div
								dangerouslySetInnerHTML={{
									__html: t("catalog.get-started.editor-desc"),
								}}
							/>
							{!hasWorkspace && (
								<p>
									<span>{t("workspace.selected")}</span>
									<code>{PageDataContextService.value.workspace.defaultPath}</code>
									<span>
										&nbsp;
										<a
											href="#"
											onClick={async () => {
												const path = await resolveModule("openDirectory")();
												if (!path) return;
												await FetchService.fetch(apiUrlCreator.setDefaultPath(path));
												await refreshPage();
											}}
										>
											{t("change")}
										</a>
									</span>
								</p>
							)}
						</>
					)
				}
				actions={
					canAddCatalog ? (
						<>
							<IsReadOnlyHOC>
								<CreateCatalog
									trigger={
										<Button fullWidth>
											<Icon code="plus" viewBox="3 3 18 18" />
											<span>{t("catalog.new")}</span>
										</Button>
									}
								/>
							</IsReadOnlyHOC>
							<Clone
								trigger={
									<Button fullWidth>
										<Icon code="cloud-download" />
										<span>{`${t("catalog.clone")}`}</span>
									</Button>
								}
								mode={Mode.clone}
							/>
							<IsReadOnlyHOC>
								<Clone
									trigger={
										<Button fullWidth>
											<Icon code="import" />
											<span>{`${t("catalog.import")}`}</span>
										</Button>
									}
									mode={Mode.import}
								/>
							</IsReadOnlyHOC>
						</>
					) : null
				}
			/>
		</div>
	);
};

export default styled(NoneGroups)`
	margin: auto 0;
	height: inherit;
	width: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
`;
