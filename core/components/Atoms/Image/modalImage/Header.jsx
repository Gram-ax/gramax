import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import { CloseIcon, DownloadIcon, RotateIcon, ZoomInIcon, ZoomOutIcon } from "./icons";

const Header = ({
	alt,
	zoomed,
	toggleZoom,
	toggleRotate,
	onClose,
	realSrc,
	enableDownload,
	enableZoom,
	enableRotate,
}) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div className="__react_modal_image__header">
			<span className="__react_modal_image__icon_menu">
				{enableDownload && (
					<a onClick={() => downloadResource(apiUrlCreator, new Path(realSrc))}>
						<DownloadIcon />
					</a>
				)}
				{enableZoom && <a onClick={toggleZoom}>{zoomed ? <ZoomOutIcon /> : <ZoomInIcon />}</a>}
				{enableRotate && (
					<a onClick={toggleRotate}>
						<RotateIcon />
					</a>
				)}
				<a onClick={onClose}>
					<CloseIcon />
				</a>
			</span>
			{alt && <span className="__react_modal_image__caption">{alt}</span>}
		</div>
	);
};

export default Header;
