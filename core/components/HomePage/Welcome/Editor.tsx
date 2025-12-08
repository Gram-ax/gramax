import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import styled from "@emotion/styled";
import useUrlImage from "@components/Atoms/Image/useUrlImage";
import ThemeService from "@ext/Theme/components/ThemeService";
import t from "@ext/localization/locale/translate";
import { ContentDivider } from "@ui-kit/Divider";
import { memo } from "react";
import { Button, RichButton } from "@ui-kit/Button";
import CanEditCatalogHOC from "@ext/enterprise/components/CanEditCatalogHOC";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { cn } from "@core-ui/utils/cn";
import resolveModule from "@app/resolveModule/frontend";
import FetchService from "@core-ui/ApiServices/FetchService";
import { useButtonsHandlers } from "@ext/catalog/actions/logic/useButtonsHandlers";
import CreateCatalog from "@ext/catalog/actions/CreateCatalog";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

const Container = styled.div`
	max-width: 469px;
	padding-left: 1.5rem;
	padding-right: 1.5rem;
	width: 100%;

	.container {
		padding: 1.5rem;
		gap: 1.15rem;
	}

	.header {
		padding-bottom: 1.25rem;
	}

	.container > :not([hidden]) ~ :not([hidden]) {
		--tw-space-y-reverse: 0;
		margin-top: calc(1.5rem * calc(1 - var(--tw-space-y-reverse)));
		margin-bottom: calc(1.5rem * var(--tw-space-y-reverse));
	}

	&.mobile {
		max-width: 100%;
		padding-right: 1rem;
		padding-left: 1rem;
	}

	&.mobile .container {
		padding: 1.25rem;
		gap: 1.25rem;
	}

	&.mobile .header {
		padding-right: 1rem;
		padding-left: 1rem;
		padding-bottom: 1rem;
	}

	&.mobile .header h1 {
		font-size: 1.15rem;
	}

	&.mobile .header .description {
		font-size: 0.875rem;
	}

	&.mobile .workspace-path {
		font-size: 0.875rem;
	}

	&.mobile .container > :not([hidden]) ~ :not([hidden]) {
		--tw-space-y-reverse: 0;
		margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse)));
		margin-bottom: calc(1.25rem * var(--tw-space-y-reverse));
	}
`;

const TopContainerWrapper = styled.div`
	> :not([hidden]) ~ :not([hidden]) {
		--tw-space-y-reverse: 0;
		margin-top: calc(0.625rem * calc(1 - var(--tw-space-y-reverse)));
		margin-bottom: calc(0.625rem * var(--tw-space-y-reverse));
	}

	&.mobile > :not([hidden]) ~ :not([hidden]) {
		--tw-space-y-reverse: 0;
		margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));
		margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));
	}
`;

const Logo = memo(({ isMobile }: { isMobile: boolean }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const theme = ThemeService.value;
	return (
		<img
			src={useUrlImage(apiUrlCreator.getLogo(theme, true))}
			className={cn(!isMobile && "w-12 h-12", isMobile && "w-11 h-11")}
		/>
	);
});

const WorkspacePath = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div className="container">
			<div className="workspace-path text-base text-muted text-center">
				<div className="font-normal whitespace-nowrap">{t("workspace.selected")}</div>
				<div className="flex items-center gap-0.5 min-w-0">
					<TextOverflowTooltip className="font-normal min-w-0 flex-1">
						{PageDataContextService.value.workspace.defaultPath}
					</TextOverflowTooltip>
					<Button
						variant="link"
						size="xl"
						className="h-auto p-0 flex-shrink-0 whitespace-nowrap"
						onClick={async () => {
							const path = await resolveModule("openDirectory")();
							if (!path) return;
							await FetchService.fetch(apiUrlCreator.setDefaultPath(path));
							await refreshPage();
						}}
					>
						{t("change")}
					</Button>
				</div>
			</div>
		</div>
	);
};

export const EditorWelcome = () => {
	const hasWorkspace = !!PageDataContextService.value.workspace.current;
	const workspacePath = WorkspaceService?.current()?.path;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const { isStatic } = usePlatform();
	const breakpoint = useBreakpoint();
	const richButtonSize = breakpoint === "sm" ? "sm" : "lg";
	const { onCloneClick, onImportClick } = useButtonsHandlers();

	const canEditCatalog = workspacePath
		? PermissionService.useCheckPermission(editCatalogPermission, workspacePath, catalogName)
		: true;

	const canAddCatalog = (() => {
		if (isStatic) return false;
		return canEditCatalog;
	})();

	return (
		<Container className={cn("mb-8", breakpoint === "sm" && "mobile")}>
			<div className="header flex flex-col justify-center items-center text-center p-6 pb-0 gap-3">
				<Logo isMobile={breakpoint === "sm"} />
				<TopContainerWrapper className={cn(breakpoint === "sm" && "mobile")}>
					<h1 className="text-2xl font-semibold sm:text-lg">{t("welcome.editor.title")}</h1>
					<div
						className="description text-base text-muted sm:text-sm font-normal"
						dangerouslySetInnerHTML={{ __html: t("welcome.editor.description") }}
					/>
				</TopContainerWrapper>
			</div>
			{canAddCatalog && (
				<div className="container">
					<CanEditCatalogHOC>
						<IsReadOnlyHOC>
							<CreateCatalog
								trigger={
									<RichButton
										icon={"plus"}
										size={richButtonSize}
										title={t("welcome.editor.options.create-blank.title")}
										description={t("welcome.editor.options.create-blank.description")}
									/>
								}
							/>
						</IsReadOnlyHOC>
					</CanEditCatalogHOC>
					<ContentDivider>
						<div className="text-sm text-center font-normal text-muted">{t("or")}</div>
					</ContentDivider>
					<RichButton
						icon={"cloud-download"}
						size={richButtonSize}
						title={t("welcome.editor.options.download-exists.title")}
						description={t("welcome.editor.options.download-exists.description")}
						onClick={onCloneClick}
					/>
					<CanEditCatalogHOC>
						<IsReadOnlyHOC>
							<RichButton
								icon={"import"}
								size={richButtonSize}
								title={t("welcome.editor.options.import-exists.title")}
								description={t("welcome.editor.options.import-exists.description")}
								onClick={onImportClick}
							/>
						</IsReadOnlyHOC>
					</CanEditCatalogHOC>
				</div>
			)}
			{!hasWorkspace && <WorkspacePath />}
		</Container>
	);
};
