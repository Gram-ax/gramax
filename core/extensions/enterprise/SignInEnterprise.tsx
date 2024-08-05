import Form from "@components/Form/Form";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import SignInEnterpriseLayoutProps from "./SignInEnterpriseLayoutProps.schema";
import Schema from "./SignInEnterpriseLayoutProps.schema.json";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";

const SignInEnterprise = ({ trigger }: { trigger: JSX.Element }) => {
	const [isOpen, setIsOpen] = useState(false);
	const glsUrl = PageDataContextService.value.conf.glsUrl;
	const incorrectEmail = t("enterprise.incorrect-email");
	const enterpriseUserNotFound = t("enterprise.user-not-found");

	return (
		<ModalLayout
			trigger={trigger}
			contentWidth="S"
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);
			}}
		>
			<ModalLayoutLight>
				<Form<SignInEnterpriseLayoutProps>
					props={{ email: undefined }}
					schema={Schema as JSONSchema7}
					fieldDirection="row"
					onSubmit={async (props) => {
						const req = await fetch(`${glsUrl}/get-GES`, {
							body: new URLSearchParams({ mail: props.email }),
							method: "post",
						});
						if (!req || !req.ok)
							return ErrorConfirmService.notify(
								new DefaultError(enterpriseUserNotFound, null, {}, true, incorrectEmail),
							);

						const gesUrl = await req.text();
						localStorage.setItem("gesUrl", gesUrl);
						window.location.replace(`${gesUrl}/sso/login`);
					}}
					validate={(props) => {
						if (!/.*@.*\..+/.test(props.email)) return { email: incorrectEmail };

						return {};
					}}
					submitText={t("sing-in")}
				/>
			</ModalLayoutLight> 
		</ModalLayout>
	);
};

export default SignInEnterprise;
