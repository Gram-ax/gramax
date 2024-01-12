import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import { useRouter } from "../../logic/Api/useRouter";
import Icon from "../Atoms/Icon";

const SingInOut = styled(({ className }: { className?: string }) => {
	const isLogged = PageDataContextService.value.isLogged;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const ssoServerUrl = PageDataContextService.value.conf.ssoServerUrl;

	if (isLogged)
		return (
			<div className={className}>
				<a href={apiUrlCreator.getAuthUrl(router).toString()} data-qa="qa-clickable">
					<Icon code={"sign-out"} />
					<span>{useLocalize("singOut")}</span>
				</a>
			</div>
		);

	if (isServerApp && ssoServerUrl)
		return (
			<>
				{/* <PopupMenuLayout
					trigger={
						<div className={className}>
							<a data-qa="qa-clickable">
								<Icon code={"sign-in"} />
								<span>{useLocalize("singIn")}</span>
							</a>
						</div>
					}
				>
					<>
						<SingInByMail /> */}
				<div>
					<a href={apiUrlCreator.getAuthUrl(router).toString()} data-qa="qa-clickable">
						<Icon code={"sign-in"} />
						<span>{useLocalize("singIn")}</span>
					</a>
				</div>
				{/* </>
				</PopupMenuLayout> */}
			</>
		);
})`
	display: flex;
	font-size: 11px;
	align-items: center;
`;

export default SingInOut;
