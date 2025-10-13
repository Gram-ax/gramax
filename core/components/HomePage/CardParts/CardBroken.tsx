import { useDismissableToast } from "@components/Atoms/DismissableToast";
import { useApi } from "@core-ui/hooks/useApi";
import styled from "@emotion/styled";
import { makeGitShareData } from "@ext/git/actions/Clone/logic/makeGitShareData";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
import type { RemoteProgressPercentage } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import getUrlFromShareData from "@ext/git/core/GitPathnameHandler/clone/logic/getUrlFromShareData";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import useStorage from "@ext/storage/logic/utils/useStorage";
import { Loader } from "@ui-kit/Loader";
import { ProgressBlockTemplate } from "@ui-kit/Template";
import { useMemo, type HTMLAttributes } from "react";

export type CloneProgressProps = {
	name: string;
	progress: RemoteProgressPercentage;
	isCancel?: boolean;
	setIsCancel?: (isCancel: boolean) => void;
	className?: string;
};

export type CardBrokenProps = { link: CatalogLink } & HTMLAttributes<HTMLDivElement>;

const CardBroken = ({ link, ...props }: CardBrokenProps) => {
	const { dismiss, show } = useDismissableToast({
		title: t("catalog.delete.progress"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const { call: removeCatalog } = useApi({
		url: (api) => api.removeCatalog(link.name),
		onStart: show,
		onDone: refreshPage,
		onFinally: () => dismiss.current?.(),
	});

	const shareData = useMemo(() => makeGitShareData(link.pathname), [link]);
	const url = useMemo(() => getUrlFromShareData(shareData), [shareData]);
	const source = useStorage(shareData.domain);

	const { startClone } = useCloneRepo({
		storageData: {
			url,
			name: link.name,
			source,
		} as GitStorageData,
		skipCheck: true,
		redirectOnClone: link.pathname,
		deleteIfExists: true,
		onError: refreshPage,
		onStart: refreshPage,
	});

	return (
		<div
			{...props}
			onClick={(ev) => {
				ev.stopPropagation();
				ev.preventDefault();
			}}
		>
			<ProgressBlockTemplate
				data-qa="loader"
				value={42}
				size="sm"
				onCancel={() => removeCatalog()}
				onRetry={() => startClone()}
				title={t("git.clone.error.title")}
			/>
		</div>
	);
};

export default styled(CardBroken)`
	span {
		font-size: 11px !important;
		color: hsl(var(--status-error)) !important;
		font-weight: 400 !important;
	}

	width: 100%;
`;
