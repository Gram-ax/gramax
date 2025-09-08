import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import { ReactElement } from "react";
import styled from "@emotion/styled";
import { ZOOM_COUNT } from "@components/Atoms/Image/modalImage/utils";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { IconButton } from "@ui-kit/Button";
import { classNames } from "@components/libs/classNames";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@ui-kit/Tooltip";
import t from "@ext/localization/locale/translate";

interface HeaderProps {
	onClose: (immediately?: boolean) => void;
	zoomImage: (count: number) => void;
	alt?: string;
	downloadSrc?: string;
	className?: string;
	isClosing?: boolean;
	modalEdit?: () => void;
}

const TooltipElement = ({ content, children }: { content: ReactElement; children: ReactElement }) => {
	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
	);
};

const Header = (props: HeaderProps): ReactElement => {
	const { zoomImage, onClose, downloadSrc, className, modalEdit, isClosing } = props;
	const rs = ResourceService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div className={classNames(className, { "data-open": !isClosing, "data-closed": isClosing })}>
			<TooltipProvider>
				{modalEdit && (
					<TooltipElement content={t("edit2")}>
						<IconButton
							variant="text"
							icon="pen"
							onClick={() => {
								modalEdit();
								onClose(true);
							}}
						/>
					</TooltipElement>
				)}
				<TooltipElement content={t("zoom-in")}>
					<IconButton variant="text" icon="zoom-in" onClick={() => zoomImage(-ZOOM_COUNT)} />
				</TooltipElement>
				<TooltipElement content={t("zoom-out")}>
					<IconButton variant="text" icon="zoom-out" onClick={() => zoomImage(ZOOM_COUNT)} />
				</TooltipElement>
				{downloadSrc && !rs.id && (
					<TooltipElement content={t("download")}>
						<a onClick={() => downloadResource(apiUrlCreator, new Path(downloadSrc))}>
							<IconButton variant="text" icon="download" />
						</a>
					</TooltipElement>
				)}
				<TooltipElement content={t("close")}>
					<IconButton variant="text" icon="x" onMouseUp={() => onClose()} />
				</TooltipElement>
			</TooltipProvider>
		</div>
	);
};

export default styled(Header)`
	position: absolute;
	display: flex;
	align-items: center;
	top: 0;
	right: 0;
	padding: 1em;
	gap: 0.5em;
	z-index: var(--z-index-article-modal);

	button {
		color: hsl(var(--inverse-muted));
	}

	button:hover {
		color: hsl(var(--inverse-primary-fg));
	}

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
