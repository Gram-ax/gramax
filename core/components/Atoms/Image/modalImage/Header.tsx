import Icon from "@components/Atoms/Icon";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import { ReactElement } from "react";
import styled from "@emotion/styled";

interface HeaderProps {
	onClose: (immediately?: boolean) => void;
	zoomImage: (count: number) => void;
	alt?: string;
	downloadSrc?: string;
	className?: string;
	modalEdit?: () => void;
}

const Header = (props: HeaderProps): ReactElement => {
	const { zoomImage, onClose, downloadSrc, className, modalEdit } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div className={className}>
			{modalEdit && (
				<Icon
					code="pen"
					onClick={() => {
						modalEdit();
						onClose(true);
					}}
				/>
			)}
			<Icon code="zoom-in" onClick={() => zoomImage(-20)} />
			<Icon code="zoom-out" onClick={() => zoomImage(20)} />
			{downloadSrc && (
				<a onClick={() => downloadResource(apiUrlCreator, new Path(downloadSrc))}>
					<Icon code="download" />
				</a>
			)}
			<Icon code="x" onMouseUp={() => onClose()} />
		</div>
	);
};

export default styled(Header)`
	position: absolute;
	display: flex;
	align-items: center;
	top: 0;
	right: 0;
	padding-top: 1.2em;
	padding-right: 1.2em;
	height: 5vh;
	gap: 1em;
	z-index: 200;

	> i,
	> a > i {
		display: flex;
		cursor: pointer !important;
		transition: 0.25s;
		font-size: var(--big-icon-size);
		color: var(--color-active-white);

		:hover {
			color: var(--color-active-white-hover);
		}
	}
`;
