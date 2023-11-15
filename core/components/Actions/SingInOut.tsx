import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import { useRouter } from "../../logic/Api/useRouter";
import Icon from "../Atoms/Icon";
import PopupMenuLayout from "../Layouts/PopupMenuLayout";
import SingInByMail from "./Modal/SingInByMail";

const SingInOut = styled(({ className }: { className?: string }) => {
	const isLogged = PageDataContextService.value.isLogged;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();
	const enterpriseServerURL = PageDataContextService.value.conf.enterpriseServerUrl;

	if (isLogged)
		return (
			<div className={className}>
				<a href={apiUrlCreator.getAuthUrl(router).toString()} data-qa="app-action">
					<Icon code={"sign-out"} />
					<span>{useLocalize("singOut")}</span>
				</a>
			</div>
		);

	if (enterpriseServerURL)
		return (
			<IsReadOnlyHOC>
				<PopupMenuLayout
					trigger={
						<div className={className}>
							<a data-qa="app-action">
								<Icon code={"sign-in"} />
								<span>{useLocalize("singIn")}</span>
							</a>
						</div>
					}
				>
					<>
						<SingInByMail />
						<div>
							<a href={apiUrlCreator.getAuthUrl(router).toString()} data-qa="app-action">
								<Icon code={"microsoft"} faFw prefix="fab" />
								<span>{useLocalize("byAzure")}</span>
							</a>
						</div>
					</>
				</PopupMenuLayout>
			</IsReadOnlyHOC>
		);
})`
	display: flex;
	font-size: 11px;
	align-items: center;
`;

export default SingInOut;
