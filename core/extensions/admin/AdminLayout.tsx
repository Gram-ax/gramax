import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONSchema7 } from "json-schema";
import { useEffect } from "react";
import Form from "../../components/Form/Form";
import { useRouter } from "../../logic/Api/useRouter";
import FetchService from "../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../ui-logic/ContextServices/ApiUrlCreator";
import AdminLayoutProps from "./AdminLayoutProps.schema";
import Schema from "./AdminLayoutProps.schema.json";

const AdminLoginLayout = styled(
	({ className, redirectCallback }: { className?: string; redirectCallback: () => void }) => {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const isLogged = PageDataContextService.value.isLogged;
		const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
		const router = useRouter();
		useEffect(() => {
			if (isLogged || gesUrl) redirectCallback();
		}, []);

		return (
			!isLogged &&
			!gesUrl && (
				<div className={className}>
					<div className="container">
						<Form<AdminLayoutProps>
							props={{ login: undefined, password: undefined }}
							schema={Schema as JSONSchema7}
							fieldDirection="row"
							onSubmit={(data) => {
								FetchService.fetch(
									apiUrlCreator.getAuthUrl(router),
									JSON.stringify(data),
									MimeTypes.json,
								).then((res) => {
									if (res.ok) redirectCallback();
								});
							}}
							submitText={t("sing-in")}
						/>
					</div>
				</div>
			)
		);
	},
)`
	display: flex;
	height: 100%;

	.container {
		margin: auto;
		width: var(--default-form-width);
	}
`;

export default AdminLoginLayout;
