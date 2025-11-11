import t from "@ext/localization/locale/translate";
import { ModalHeader, ModalTitle, ModalClose } from "@ui-kit/Modal";
import { FormFooter } from "@ui-kit/Form";
import { Button } from "@ui-kit/Button";
import { showPopover } from "@core-ui/showPopover";
import { Description } from "@ui-kit/Description";
import Anchor from "@components/controls/Anchor";
import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import CloudModalBody from "@ext/static/components/CloudModalBody";
import useGetCatalogCloudUrl from "@ext/static/utils/cloudUrl";

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
					<Anchor className="anchor" href={url} data-qa="qa-clickable">
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
