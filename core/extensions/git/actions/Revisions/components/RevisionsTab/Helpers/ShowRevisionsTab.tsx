import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";
import { useRouter } from "@core/Api/useRouter";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import getCommitOidFromPathname from "@ext/git/actions/Revisions/logic/utils/getCommitOidFromPathname";
import t from "@ext/localization/locale/translate";
import { Indicator } from "@ui-kit/Indicator";
import { useMemo } from "react";

interface ShowRevisionsTabProps {
	isShow: boolean;
	setShow: (show: boolean) => void;
}

const ShowRevisionsTab = (props: ShowRevisionsTabProps) => {
	const { isShow, setShow } = props;
	const { isNext } = usePlatform();
	if (isNext) return null;
	const router = useRouter();
	const isRevision = useMemo(() => {
		return !!getCommitOidFromPathname(router.path);
	}, [router.path]);

	return (
		<div className="relative">
			{isRevision && (
				<Indicator
					className="absolute right-0.5 top-0.5 bg-status-error rounded-full pointer-events-none"
					size="xs"
				/>
			)}
			<StatusBarWrapper
				additionalStyles={{ height: "100%" }}
				dataQa="qa-revisions-tab"
				iconCode="history"
				iconStrokeWidth="1.6"
				iconStyle={isShow ? { color: "var(--color-primary)" } : { color: "white" }}
				isShow={isShow}
				onClick={() => setShow(!isShow)}
				tooltipText={t("git.revisions.compare-button")}
			/>
		</div>
	);
};

export default ShowRevisionsTab;
