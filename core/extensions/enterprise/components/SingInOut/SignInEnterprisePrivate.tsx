import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useSignIn } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import SignInEnterpriseForm from "@ext/enterprise/components/SingInOut/SignInEnterpriseForm";
import t from "@ext/localization/locale/translate";
import Head from "next/head";

export const SignInEnterprisePrivate = () => {
	const authUrl = ApiUrlCreatorService.value.getAuthUrl(useRouter(), false).toString();
	const signInProps = useSignIn({ authUrl });
	const title = t("enterprise-guest.privateTitle");
	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>
			<div className="min-h-screen flex items-center justify-center px-4 py-8">
				{/* 443px for InputOTP to be aligned with Email input */}
				<div className="max-w-[443px] rounded-3xl border bg-white p-6 shadow-lg">
					<SignInEnterpriseForm
						authUrl={authUrl}
						{...signInProps}
						description={t("enterprise-guest.privateDescription")}
						title={title}
					/>
				</div>
			</div>
		</>
	);
};
