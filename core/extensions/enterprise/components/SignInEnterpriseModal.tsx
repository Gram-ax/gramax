import SignInEnterpriseForm from "@ext/enterprise/components/SignInEnterpriseForm";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import { IconButton } from "@ui-kit/Button";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useCallback, useState } from "react";

const SignInEnterpriseModal = ({ authUrl }: { authUrl: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	const { resetForm, relocateToAuthUrl, onlySSO, ...otherFields } = useSignInEnterprise({ authUrl });

	const onOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				resetForm();
			}
			setIsOpen(value);
		},
		[resetForm],
	);

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			<ModalTrigger asChild>
				<IconButton
					variant="ghost"
					icon="log-in"
					onClick={(e) => {
						if (onlySSO) {
							e.stopPropagation();
							e.preventDefault();
							relocateToAuthUrl();
						}
					}}
				/>
			</ModalTrigger>
			<ModalContent data-modal-root data-sign-in-enteprise-form>
				<ModalBody>
					<SignInEnterpriseForm
						authUrl={authUrl}
						relocateToAuthUrl={relocateToAuthUrl}
						onlySSO={onlySSO}
						{...otherFields}
					/>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default SignInEnterpriseModal;
