import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import lucideIconList, { iconFilter, toListItem } from "@components/Atoms/Icon/lucideIconList";
import Input from "@components/Atoms/Input";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { clearData } from "@core-ui/ContextServices/RefreshPageContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { uniqueName } from "@core/utils/uniqueName";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import EditCustomTheme from "@ext/workspace/components/EditCustomTheme";
import { useWorkspaceLogo } from "@ext/workspace/components/useWorkspaceLogo";
import { useWorkspaceStyle } from "@ext/workspace/components/useWorkspaceStyle";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useMemo, useState } from "react";

export interface WorkspaceFormProps {
	create?: boolean;
	workspace?: ClientWorkspaceConfig;
	onSave?: () => void;
	className?: string;
}

const WorkspaceForm = (Props: WorkspaceFormProps) => {
	const { onSave, workspace, create = false, className } = Props;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const workspaces = WorkspaceService.workspaces();
	const pathPlaceholder = WorkspaceService.defaultPath();
	const askPath = getExecutingEnvironment() == "tauri";

	const { confirmChanges: confirmLogo, ...workspaceLogoProps } = useWorkspaceLogo(workspace?.path);
	const { confirmChanges: confirmStyle, ...workspaceStyleProps } = useWorkspaceStyle(workspace?.path);

	const [deleteInProgress, setDeleteInProgress] = useState(false);

	const defaultPath = useMemo(
		() =>
			uniqueName(
				pathPlaceholder + "/default",
				workspaces.map((w) => w.path),
			),
		[workspaces],
	);

	const [props, setProps] = useState<ClientWorkspaceConfig>(
		workspace ? { ...workspace } : { name: "", path: defaultPath, icon: "" },
	);

	const isNameUnique = useMemo(
		() =>
			props.name?.length > 0 &&
			(create
				? !workspaces.find((w) => w.name == props.name)
				: !workspaces.find((w) => w.path != props.path && w.name == props.name)),
		[props.name],
	);

	const isPathValid = useMemo(
		() =>
			create ? props.path?.length > 0 && !workspaces.find((w) => w.path == props.path) : props.path?.length > 0,
		[props.path],
	);

	const canSave = isNameUnique && isPathValid && !deleteInProgress;

	const saveWorkspace = async () => {
		if (!canSave) return;

		if (!askPath && create)
			props.path = uniqueName(
				pathPlaceholder + "/workspace",
				workspaces.map((w) => w.path),
			);

		clearData();
		await FetchService.fetch(
			create ? apiUrlCreator.createWorkspace() : apiUrlCreator.editWorkspace(),
			JSON.stringify(props),
		);
		await confirmLogo();
		await confirmStyle();
		await refreshPage();
	};

	const removeTranslated =
		getExecutingEnvironment() == "browser" ? t("workspace.delete.web") : t("workspace.delete.desktop");

	const removeWorkspace = async () => {
		if (!(await confirm(removeTranslated))) return;
		setDeleteInProgress(true);
		clearData();
		await FetchService.fetch(apiUrlCreator.removeWorkspace(workspace.path));
		onSave?.();
		await refreshPage();
	};

	return (
		<ModalLayoutLight className={className}>
			<FormStyle formDirection="column">
				<>
					<legend>{t("workspace.edit")}</legend>
					<fieldset>
						<div className="form-group">
							<div className="field field-string row">
								<label className="control-label">
									{t("name")}
									<span className="required">*</span>
								</label>
								<div className={`input-lable`}>
									<Input
										showErrorText={!isNameUnique}
										errorText={!isNameUnique ? t("cant-be-same-name") : null}
										isCode
										placeholder="Gramax"
										value={props.name}
										maxLength={30}
										onChange={(e) => {
											props.name = e.target.value ?? "";
											setProps({ ...props });
										}}
									/>
								</div>
							</div>
						</div>
						<div className="form-group">
							<div className="field field-string row">
								<label className="control-label">{t("icon")}</label>
								<div className={`input-lable`} style={{ display: "flex", gap: "1rem" }}>
									<ListLayout
										placeholder={t("icon")}
										items={lucideIconList}
										filterItems={iconFilter([], true)}
										item={toListItem({ code: props.icon ?? "" })}
										onItemClick={(value) => {
											props.icon = value;
											setProps({ ...props });
										}}
									/>
								</div>
							</div>
						</div>

						{askPath && (
							<div className="form-group">
								<div className="field field-string row">
									<label className="control-label">
										{t("working-directory")}
										<span className="required">*</span>
									</label>
									<div className={`input-lable `} style={{ display: "flex", gap: "1rem" }}>
										<Input
											showErrorText={!isPathValid}
											errorText={!isPathValid ? t("cant-be-same-path") : null}
											isCode
											readOnly
											placeholder={pathPlaceholder}
											value={props.path}
											onChange={(e) => {
												props.path = e.target.value ?? "";
												setProps({ ...props });
											}}
										/>
										{create && (
											<Button
												onClick={async () => {
													props.path = (await resolveModule("openDirectory")()) || props.path;
													setProps({ ...props });
												}}
											>
												{t("open")}
											</Button>
										)}
									</div>
								</div>

								<div className={`input-lable-description `}>
									<div />
									<div className="article">
										<p>{t("workspace.path-desc")}</p>
									</div>
								</div>
							</div>
						)}
					</fieldset>
					{workspace?.path && <EditCustomTheme {...workspaceStyleProps} {...workspaceLogoProps} />}
					<div className="buttons">
						<div className="left-buttons">
							{!create && workspaces.length > 1 && (
								<Button
									disabled={deleteInProgress}
									buttonStyle={ButtonStyle.underline}
									onClick={removeWorkspace}
								>
									{deleteInProgress && (
										<span className="spinner-container">
											<SpinnerLoader height={15} width={15} fullScreen />
										</span>
									)}
									<span>{t("delete")}</span>
								</Button>
							)}
						</div>
						<Button
							buttonStyle={ButtonStyle.default}
							disabled={!canSave}
							onClick={async () => {
								await saveWorkspace();
								onSave?.();
							}}
						>
							<span>{t("save")}</span>
						</Button>
					</div>
				</>
			</FormStyle>
		</ModalLayoutLight>
	);
};

export default styled(WorkspaceForm)`
	max-width: 50rem;

	.spinner-container {
		margin-right: 0.1rem;
	}

	.second_header {
		margin-top: 1.5rem;
		margin-bottom: 0.5em;
		font-size: 22px;
	}

	.assets_row_item {
		.row {
			align-items: start !important;
		}
		.control-label {
			margin-top: 7.4px;
		}
	}

	.hide_text {
		span {
			width: 0;
			opacity: 0;
			padding: 0 !important;
		}
	}

	.secondary_logo_action {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.change_logo_actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
`;
