import SignInEnterpriseForm from "@ext/enterprise/components/SignInEnterpriseForm";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import { IconButton } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogTrigger } from "@ui-kit/Dialog";
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
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogTrigger asChild>
				<IconButton
					icon="log-in"
					onClick={(e) => {
						if (onlySSO) {
							e.stopPropagation();
							e.preventDefault();
							relocateToAuthUrl();
						}
					}}
					variant="ghost"
				/>
			</DialogTrigger>
			<DialogContent data-modal-root data-sign-in-enteprise-form>
				<DialogBody>
					<SignInEnterpriseForm
						authUrl={authUrl}
						onlySSO={onlySSO}
						relocateToAuthUrl={relocateToAuthUrl}
						{...otherFields}
					/>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};

export default SignInEnterpriseModal;
