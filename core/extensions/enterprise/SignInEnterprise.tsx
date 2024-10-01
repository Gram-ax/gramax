import resolveModule from "@app/resolveModule/frontend";
import Form from "@components/Form/Form";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import SignInEnterpriseLayoutProps from "./SignInEnterpriseLayoutProps.schema";
import Schema from "./SignInEnterpriseLayoutProps.schema.json";

const SignInEnterprise = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const { isBrowser } = usePlatform();
	const [isOpen, setIsOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const glsUrl = PageDataContextService.value.conf.glsUrl;
	const incorrectEmail = t("error-sing-in");
	const enterpriseUserNotFound = t("enterprise.user-not-found");

	return (
		<ModalLayout
			trigger={trigger}
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
					fieldDirection="column"
					onSubmit={async (props) => {
						const req = await fetch(`${glsUrl}/get-GES`, {
							body: new URLSearchParams({ mail: props.email }),
							method: "post",
						});
						if (!req || !req.ok) {
							return ErrorConfirmService.notify(
								new DefaultError(enterpriseUserNotFound, null, {}, true, incorrectEmail),
							);
						}

						const gesUrl = await req.text();
						localStorage.setItem("gesUrl", gesUrl);

						const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
						const redirect = encodeURIComponent(`${gesUrl}/enterprise/user-settings`);
						const url = `${gesUrl}/sso/login?redirect=${redirect}&from=${from}`;

						if (isBrowser) return window.location.replace(url);
						await resolveModule("enterpriseLogin")(url, apiUrlCreator, router);
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
