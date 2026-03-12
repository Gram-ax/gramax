import ModalLayout from "@components/Layouts/Modal";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useState } from "react";
import ModalLayoutLight from "../../../components/Layouts/ModalLayoutLight";
import { SignInEnterpriseCloudForm } from "./SignInEnterpriseCloudForm";

const SignInModalTrigger = ({ gesUrl, className }: { gesUrl: string; className?: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<ModalLayout
			className={className}
			contentWidth={"XS"}
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			onOpen={() => {
				setIsOpen(true);
			}}
			trigger={
				<div>
					<Tooltip>
						<TooltipContent>
							<p>{t("sing-in")}</p>
						</TooltipContent>
						<TooltipTrigger asChild>
							<IconButton
								className="p-2"
								icon={"user-round"}
								iconClassName="w-5 h-5 stroke-[1.6]"
								size="lg"
								variant="ghost"
							/>
						</TooltipTrigger>
					</Tooltip>
				</div>
			}
		>
			<ModalLayoutLight className="modal-layout-light">
				<SignInEnterpriseCloudForm allowContinueWithoutAccount={false} gesUrl={gesUrl} />
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default styled(SignInModalTrigger)`
	.modal-layout-light {
		padding-bottom: 1.5rem;
	}
`;
