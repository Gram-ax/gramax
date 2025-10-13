import { ReactElement } from "react";
import styled from "@emotion/styled";
import { MediaHeaderButton } from "@components/Atoms/Image/modalImage/MediaHeaderButton";
import t from "@ext/localization/locale/translate";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import { usePlatform } from "@core-ui/hooks/usePlatform";

interface PreviewModalHeaderProps {
	path: Path;
	className?: string;
	openInSupportedApp: () => void;
	closeModal: () => void;
}

const PreviewModalHeaderUnstyled = (props: PreviewModalHeaderProps): ReactElement => {
	const { className, closeModal, path, openInSupportedApp } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isTauri } = usePlatform();

	const downloadFile = () => {
		downloadResource(apiUrlCreator, path);
	};

	return (
		<div className={className}>
			{isTauri && (
				<MediaHeaderButton
					icon="external-link"
					onClick={openInSupportedApp}
					tooltipText={t("open-in-supported-app")}
				/>
			)}
			<MediaHeaderButton icon="download" onClick={downloadFile} tooltipText={t("download")} />
			<MediaHeaderButton icon="x" onClick={() => closeModal()} tooltipText={t("close")} />
		</div>
	);
};

export const PreviewModalHeader = styled(PreviewModalHeaderUnstyled)`
	position: absolute;
	display: flex;
	align-items: center;
	top: 0;
	right: 0;
	padding: 1em;
	gap: 0.5em;
	z-index: var(--z-index-article-modal);
`;
