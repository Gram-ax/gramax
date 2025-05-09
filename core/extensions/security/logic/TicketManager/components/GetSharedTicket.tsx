import Checkbox from "@components/Atoms/Checkbox";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import Form from "@rjsf/core";
import { useEffect, useState } from "react";

const jsonScheme = {
	type: "object",
	properties: {
		date: {
			format: "date",
			type: "string",
			default: "01.01.9999",
		},
	},
};

const GetSharedTicket = styled((props: { trigger: JSX.Element; className?: string }) => {
	const { trigger, className } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [date, setDate] = useState<string>("01.01.9999");
	const [group, setGroup] = useState<string>(null);
	const [groups, setGroups] = useState<string[]>(null);
	const [ticket, setTicket] = useState<string>(null);
	const [showData, setShowDate] = useState(false);
	const sharedLinkUrl = apiUrlCreator.getShareTicket(group, date);

	const { isNext } = usePlatform();
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current().path;
	const canEditCatalog = PermissionService.useCheckPermission(
		editCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	useEffect(() => {
		const loadGroups = async () => {
			const permissionValuesUrl = apiUrlCreator.getPermissionValuesUrl();
			const res = await FetchService.fetch<string[]>(permissionValuesUrl);
			if (!res.ok) return;
			setGroups(await res?.json?.());
		};
		loadGroups();
	}, [apiUrlCreator]);

	jsonScheme.properties.date.default = date;

	if (!groups?.length || !isNext || !canEditCatalog) return null;
	return (
		<Modal
			trigger={trigger}
			onClose={() => {
				setDate("01.01.9999");
				setGroup(null);
				setTicket(null);
				setShowDate(false);
			}}
			onOpen={() => {}}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<h2>{t("share.name.catalog")}</h2>
						<Checkbox
							className="checkbox"
							checked={showData}
							onClick={() => {
								setShowDate(!showData);
							}}
						>
							<span>{t("link-end-date")}</span>
						</Checkbox>
						{!showData ? null : (
							<Form
								schema={jsonScheme as any}
								validator={{
									validateFormData: () => null,
									toErrorList: () => null,
									isValid: () => true,
									rawValidation: () => null,
								}}
								onSubmit={() => {}}
								onChange={(value: any) => {
									setDate(value.formData.date);
								}}
								className={className}
							/>
						)}

						<label>{t("users-group")}</label>
						<div className="field">
							<ListLayout
								items={groups ?? []}
								onItemClick={(item) => {
									setGroup(item);
								}}
								placeholder={t("all-groups")}
							/>
						</div>
						<div className="article global">
							<div
								className="btn"
								onClick={async () => {
									const res = await FetchService.fetch(sharedLinkUrl);
									if (!res.ok) return;
									setTicket(await res.text());
								}}
							>
								{t("generate-link")}
							</div>
						</div>
						<div
							className="article bottom-content res"
							style={ticket ? { transform: "translateY(0%)" } : { padding: 0 }}
						>
							{ticket && (
								<div className="field small-code">
									<CodeBlock value={ticket} />
								</div>
							)}
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
})`
	.btn,
	.control-label {
		display: none;
	}
`;

export default GetSharedTicket;
