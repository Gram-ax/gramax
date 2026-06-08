import Path from "@core/FileProvider/Path/Path";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import downloadResource from "@core-ui/downloadResource";
import { cn } from "@core-ui/utils/cn";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import type { ReactElement } from "react";

interface HeaderProps {
	onClose: (immediately?: boolean) => void;
	zoomImage: (count: number) => void;
	alt?: string;
	downloadSrc?: string;
	resourceId?: string;
	resourceProvider?: ArticleProviderType;
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

const iconButtonClassName = "text-[hsl(var(--inverse-muted))] hover:text-[hsl(var(--inverse-primary-fg))]";

const Header = (props: HeaderProps): ReactElement => {
	const { zoomImage, onClose, downloadSrc, resourceId, resourceProvider, className, modalEdit, isClosing } = props;
	const rs = ResourceService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div
			className={cn(
				"absolute flex items-center top-0 right-0 p-[1em] gap-[0.5em] z-[var(--z-index-article-modal)]",
				{ "data-open": !isClosing, "data-closed": isClosing },
				className,
			)}
		>
			<TooltipProvider>
				{modalEdit && (
					<TooltipElement content={t("edit2")}>
						<IconButton
							className={iconButtonClassName}
							icon="pen"
							onClick={() => modalEdit()}
							variant="text"
						/>
					</TooltipElement>
				)}
				<TooltipElement content={t("zoom-in")}>
					<IconButton
						className={iconButtonClassName}
						icon="zoom-in"
						onClick={() => zoomImage(-1)}
						variant="text"
					/>
				</TooltipElement>
				<TooltipElement content={t("zoom-out")}>
					<IconButton
						className={iconButtonClassName}
						icon="zoom-out"
						onClick={() => zoomImage(1)}
						variant="text"
					/>
				</TooltipElement>
				{downloadSrc && (!rs.id || resourceId) && (
					<TooltipElement content={t("download")}>
						<a
							className="cursor-pointer"
							// biome-ignore lint/a11y/useValidAnchor: it's ok
							onClick={() => {
								downloadResource(apiUrlCreator, new Path(downloadSrc), resourceId, resourceProvider);
							}}
						>
							<IconButton className={iconButtonClassName} icon="download" variant="text" />
						</a>
					</TooltipElement>
				)}
				<TooltipElement content={t("close")}>
					<IconButton className={iconButtonClassName} icon="x" onMouseUp={() => onClose()} variant="text" />
				</TooltipElement>
			</TooltipProvider>
		</div>
	);
};

export default Header;
