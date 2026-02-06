import type { GetNameAfterMoveResult } from "@app/commands/article/getNameAfterMove";
import { useDismissableToast } from "@components/Atoms/DismissableToast";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { useRouter } from "@core/Api/useRouter";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { RequestStatus, useDeferApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type DuplicateArticleDialog from "@ext/article/actions/move/DuplicateArticleDialog";
import t from "@ext/localization/locale/translate";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { Loader } from "@ui-kit/Loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, useRef } from "react";
import SelectTargetWorkspaceAndCatalog, { type SelectCatalogResult } from "./SelectWorkspaceAndCatalog";

interface ArticleMoveActionProps {
	articlePath: string;
	catalogName: string;
}

const ArticleMoveAction = ({ articlePath, catalogName: sourceCatalogName }: ArticleMoveActionProps) => {
	const targetWorkspaceRef = useRef<WorkspacePath | null>(null);
	const targetCatalogRef = useRef<string | null>(null);
	const createNewCatalogRef = useRef<boolean>(false);

	const hasLanguage = useCatalogPropsStore((s) => s.data?.supportedLanguages?.length > 1 || !!s.data?.language);

	const router = useRouter();

	const { show, dismiss } = useDismissableToast({
		title: t("article.move.progress"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const { call: moveArticle, status: moveArticleStatus } = useDeferApi<{ redirectTo: string }>({
		onStart: () => {
			show();
		},
		onDone: (data) => {
			router.pushPath(data.redirectTo);
		},
		onFinally: () => {
			dismiss.current?.();
			targetWorkspaceRef.current = null;
			targetCatalogRef.current = null;
		},
	});

	const { call: checkAndMove, status: checkAndMoveStatus } = useDeferApi<GetNameAfterMoveResult>({
		onDone: async (data) => {
			if (!data.exists) {
				await moveArticle({
					url: (api) =>
						api.moveArticle(
							articlePath,
							targetWorkspaceRef.current?.toString(),
							data.createdCatalogName ? data.createdCatalogName : targetCatalogRef.current?.toString(),
							sourceCatalogName,
							data.resolvedName,
							data.resolvedTitle,
							null,
						),
				});
				return;
			}

			ModalToOpenService.setValue<ComponentProps<typeof DuplicateArticleDialog>>(
				ModalToOpen.DuplicateArticleDialog,
				{
					articleName: data.originalName,
					targetCatalogName: targetCatalogRef.current?.toString(),
					targetWorkspaceName: targetWorkspaceRef.current?.toString(),
					onResolve: async (resolution) => {
						ModalToOpenService.resetValue();

						if (!resolution) return;

						const nameToUse = resolution === "replace" ? data.originalName : data.resolvedName;
						const titleToUse = resolution === "replace" ? data.originalTitle : data.resolvedTitle;

						await moveArticle({
							url: (api) =>
								api.moveArticle(
									articlePath,
									targetWorkspaceRef.current,
									createNewCatalogRef.current
										? data.createdCatalogName
										: targetCatalogRef.current?.toString(),
									sourceCatalogName,
									nameToUse,
									titleToUse,
									resolution,
								),
						});
					},
				},
			);
		},
	});

	const startMoveArticle = async (result: SelectCatalogResult) => {
		targetWorkspaceRef.current = result.workspacePath;
		targetCatalogRef.current = result.type === "createNew" ? null : result.name;
		createNewCatalogRef.current = result.type === "createNew";

		await checkAndMove({
			url: (api) => {
				const url = api.getArticleNameAfterMove(
					articlePath,
					targetWorkspaceRef.current?.toString(),
					targetCatalogRef.current?.toString(),
					sourceCatalogName,
					createNewCatalogRef.current,
				);
				return url;
			},
		});
	};

	const isLoading = moveArticleStatus === RequestStatus.Loading || checkAndMoveStatus === RequestStatus.Loading;

	if (hasLanguage) {
		return (
			<Tooltip>
				<TooltipTrigger className="w-full">
					<DropdownMenuItem disabled>
						<Icon code="arrow-right" />
						{t("article.move.to-workspace")}
					</DropdownMenuItem>
				</TooltipTrigger>
				<TooltipContent>{t("article.move.cannot-move-language")}</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger disabled={isLoading} onClick={(ev) => ev.stopPropagation()}>
					{isLoading ? <SpinnerLoader height={16} width={16} /> : <Icon code="arrow-right" />}
					{t("article.move.to-workspace")}
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					<SelectTargetWorkspaceAndCatalog
						excludeCurrent={false}
						onlyCurrent={true}
						onSelect={startMoveArticle}
					/>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		</>
	);
};

export default ArticleMoveAction;
