import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import { StyledButton } from "@ext/artilce/LinkCreator/components/SelectLinkItem";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";

const FileMenu = ({ onDelete, resourcePath }: { onDelete: () => void; resourcePath: string }) => {
	const path = new Path(window.decodeURIComponent(resourcePath));
	const apiUrlCreator = ApiUrlCreatorService.value;

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
					<Button icon="trash" onClick={onDelete} tooltipText={t("delete-file")} />
				</ButtonsLayout>
			</div>
		</ModalLayoutDark>
	);
};

export default FileMenu;
