import Icon from "@components/Atoms/Icon";
import Anchor from "@components/controls/Anchor";
import { showPopover } from "@core-ui/showPopover";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import CloudModalBody from "@ext/static/components/CloudModalBody";
import useGetCatalogCloudUrl from "@ext/static/utils/cloudUrl";
import { Button } from "@ui-kit/Button";
import { Description } from "@ui-kit/Description";
import { FormFooter } from "@ui-kit/Form";
import { ModalClose, ModalHeader, ModalTitle } from "@ui-kit/Modal";

const IconComponent = ({ className }: { className?: string }) => {
	return (
		<div className={className}>
			<Icon code="cloud-check"></Icon>
		</div>
	);
};

const StyledIconComponent = styled(IconComponent)`
	margin-right: 0.75rem;
	font-size: 1.5rem;
	display: flex;

	svg {
		stroke-width: 2;
	}
`;

const Uploaded = () => {
	const url = useGetCatalogCloudUrl();

	const onCopyClick = () => {
		navigator.clipboard.writeText(url);
		showPopover(t("share.popover"));
	};

	return (
		<>
			<ModalHeader>
				<div className="flex items-center">
					<StyledIconComponent className="text-primary-fg" />
					<ModalTitle>{t("cloud.uploaded-modal.title")}</ModalTitle>
				</div>
			</ModalHeader>
			<CloudModalBody>
				<p>
					{t("cloud.uploaded-modal.link") + ": "}
					<br />
					<Anchor className="anchor" data-qa="qa-clickable" href={url}>
						{url}
					</Anchor>
				</p>
				<Description>{t("cloud.uploaded-modal.description")}</Description>
			</CloudModalBody>
			<FormFooter
				primaryButton={
					<ModalClose>
						<Button onClick={onCopyClick} startIcon="copy">
							{`${t("copy")} ${t("link2").toLowerCase()}`}
						</Button>
					</ModalClose>
				}
			/>
		</>
	);
};

export default Uploaded;
