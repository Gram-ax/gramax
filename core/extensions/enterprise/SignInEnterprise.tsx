import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";

const SignInEnterprise = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const { isBrowser } = usePlatform();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;

	return (
		<div
			onClick={async () => {
				const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
				const redirect = encodeURIComponent(`${gesUrl}/enterprise/sso/assert`);
				const url = `${gesUrl}/sso/login?redirect=${redirect}&from=${from}`;
				if (isBrowser) return window.location.replace(url);
				await resolveModule("enterpriseLogin")(url, apiUrlCreator, router);
			}}
		>
			{trigger}
		</div>
	);

	// const [isOpen, setIsOpen] = useState(false);
	// const incorrectEmail = t("error-sing-in");
	// const enterpriseUserNotFound = t("enterprise.user-not-found");
	// return (
	// 	<ModalLayout
	// 		trigger={trigger}
	// 		isOpen={isOpen}
	// 		closeOnCmdEnter={false}
	// 		onOpen={() => {
	// 			setIsOpen(true);
	// 		}}
	// 		onClose={() => {
	// 			setIsOpen(false);
	// 		}}
	// 	>
	// 		<ModalLayoutLight>
	// 			<Form<SignInEnterpriseLayoutProps>
	// 				props={{ email: undefined }}
	// 				schema={Schema as JSONSchema7}
	// 				fieldDirection="column"
	// 				onSubmit={async (props) => {
	// 					if (!gesUrl) {
	// 						ErrorConfirmService.notify(
	// 							new DefaultError(enterpriseUserNotFound, null, {}, true, incorrectEmail),
	// 						);
	// 						return;
	// 					}

	// 					localStorage.setItem("gesUrl", gesUrl);

	// 					const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
	// 					const redirect = encodeURIComponent(`${gesUrl}/enterprise/sso/assert`);
	// 					const url = `${gesUrl}/sso/login?redirect=${redirect}&from=${from}`;

	// 					if (isBrowser) return window.location.replace(url);
	// 					await resolveModule("enterpriseLogin")(url, apiUrlCreator, router);
	// 				}}
	// 				validate={(props) => {
	// 					if (!/.*@.*\..+/.test(props.email)) return { email: incorrectEmail };
	// 					return {};
	// 				}}
	// 				submitText={t("sing-in")}
	// 			/>
	// 		</ModalLayoutLight>
	// 	</ModalLayout>
	// );
};

export default SignInEnterprise;
