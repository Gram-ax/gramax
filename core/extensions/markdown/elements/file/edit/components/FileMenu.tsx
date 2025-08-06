import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import FileTranscription from "@ext/ai/components/Audio/FileTranscription";
import { ALLOWED_MEDIA_EXTENSIONS as ALLOWED_MEDIA_EXTENSIONS_AI } from "@ext/ai/models/consts";
import { StyledButton } from "@ext/artilce/LinkCreator/components/SelectLinkItem";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";

interface FileMenuProps {
	onDelete: () => void;
	resourcePath: string;
	aiEnabled: boolean;
}

const FileMenu = ({ onDelete, resourcePath, aiEnabled }: FileMenuProps) => {
	const path = new Path(window.decodeURIComponent(resourcePath));
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isMediaFile = aiEnabled && ALLOWED_MEDIA_EXTENSIONS_AI.includes(path.extension.toLowerCase());

	const anchorClickHandler = () => {
		void downloadResource(apiUrlCreator, path);
	};

	return (
		<ModalLayoutDark>
			<div>
				<ButtonsLayout>
					<a
						style={{ color: "var(--color-article-bg)", width: "100%", textDecoration: "none" }}
						onClick={anchorClickHandler}
					>
						<StyledButton icon={"file"} title={path.nameWithExtension} text={path.nameWithExtension} />
					</a>

					<div className="divider" />
					{isMediaFile && <FileTranscription path={path} />}
					<Button icon="trash" onClick={onDelete} tooltipText={t("delete-file")} />
				</ButtonsLayout>
			</div>
		</ModalLayoutDark>
	);
};

export default FileMenu;
