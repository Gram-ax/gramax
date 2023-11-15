import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import Button from "@ext/markdown/core/edit/components/Menu/Button";

const FileMenu = ({ onDelete, resourcePath }: { onDelete: () => void; resourcePath: string }) => {
	const path = new Path(resourcePath);
	const apiUrlCreator = ApiUrlCreatorService.value;
	return (
		<ModalLayoutDark>
			<div>
				<ButtonsLayout>
					<Input value={path.nameWithExtension} disable />
					<div className="divider" />
					<a
						style={{ color: "var(--color-article-bg)" }}
						onClick={() => downloadResource(apiUrlCreator, path)}
					>
						<Button icon="download" tooltipText={"Скачать файл"} />
					</a>
					<div className="divider" />
					<Button icon="trash" onClick={onDelete} tooltipText={"Удалить файл"} />
				</ButtonsLayout>
			</div>
		</ModalLayoutDark>
	);
};

export default FileMenu;
