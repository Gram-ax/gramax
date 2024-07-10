import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import Button from "@ext/markdown/core/edit/components/Menu/Button";

const FileMenu = ({ onDelete, resourcePath }: { onDelete: () => void; resourcePath: string }) => {
	const path = new Path(window.decodeURIComponent(resourcePath));
	const apiUrlCreator = ApiUrlCreatorService.value;
	const lang = PageDataContextService.value?.lang;

	const anchorClickHandler = () => {
		void downloadResource(apiUrlCreator, path, lang);
	};

	return (
		<ModalLayoutDark>
			<div>
				<ButtonsLayout>
					<a
						style={{ color: "var(--color-article-bg)", width: "100%", textDecoration: "none" }}
						onClick={anchorClickHandler}
					>
						<Button
							icon={"file"}
							title={path.nameWithExtension}
							className={"buttonView"}
							text={path.nameWithExtension}
						/>
					</a>

					<div className="divider" />
					<Button icon="trash" onClick={onDelete} tooltipText={"Удалить файл"} />
				</ButtonsLayout>
			</div>
		</ModalLayoutDark>
	);
};

export default FileMenu;
