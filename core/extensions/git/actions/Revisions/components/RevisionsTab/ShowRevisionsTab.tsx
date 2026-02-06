import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";

interface ShowRevisionsTabProps {
	isShow: boolean;
	setShow: (show: boolean) => void;
}

const ShowRevisionsTab = (props: ShowRevisionsTabProps) => {
	const { isShow, setShow } = props;
	const { isNext } = usePlatform();
	if (isNext) return null;

	return (
		<StatusBarWrapper
			dataQa="qa-revisions-tab"
			iconCode="history"
			iconStrokeWidth="1.6"
			iconStyle={isShow ? { color: "var(--color-primary)" } : { color: "white" }}
			isShow={isShow}
			onClick={() => setShow(!isShow)}
			tooltipText={t("git.revisions.compare-button")}
		/>
	);
};

export default ShowRevisionsTab;
