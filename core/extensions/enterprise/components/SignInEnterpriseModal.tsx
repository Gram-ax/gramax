import Button from "@components/Atoms/Button/Button";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import styled from "@emotion/styled";
import GuestEnterprise from "@ext/enterprise/components/GuestEnterprise";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

enum AuthMethod {
	SSO = "sso",
	GUEST_MAIL = "guest_mail",
}

const StyledAuthButton = styled(Button)`
	width: 100%;
	margin-bottom: 1em;

	> p {
		text-align: center;
	}

	.content {
		width: 100%;
		justify-content: center;
	}
`;

const SighInEnterpriseModal = ({ authUrl }: { authUrl: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [showGuestView, setShowGuestView] = useState(false);
	const workspace = WorkspaceService.current();

	const relocateToAuthUrl = () => {
		window.location.href = authUrl;
	};

	const handleShowGuest = () => {
		setShowGuestView(true);
	};

	const handleCloseModal = () => {
		setIsOpen(false);
		setShowGuestView(false);
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={handleCloseModal}
			contentWidth="XS"
			trigger={<ButtonLink iconCode="log-in" text={t("sing-in")} />}
		>
			<ModalLayoutLight>
				<FormStyle>
					{showGuestView ? (
						<GuestEnterprise />
					) : (
						<>
							<legend>{t("sing-in")}</legend>
							<StyledAuthButton onClick={relocateToAuthUrl}>SSO</StyledAuthButton>
							{workspace.enterprise.authMethods?.includes(AuthMethod.GUEST_MAIL) && (
								<StyledAuthButton onClick={handleShowGuest}>
									{t("enterprise-guest.buttons.continueAsGuestButton")}
								</StyledAuthButton>
							)}
						</>
					)}
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default SighInEnterpriseModal;
