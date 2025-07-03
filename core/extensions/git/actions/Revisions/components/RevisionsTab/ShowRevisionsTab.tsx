import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";
import t from "@ext/localization/locale/translate";

interface ShowRevisionsTabProps {
	isShow: boolean;
	setShow: (show: boolean) => void;
}

const ShowRevisionsTab = (props: ShowRevisionsTabProps) => {
	const { isShow, setShow } = props;

	return (
		<StatusBarWrapper
			isShow={isShow}
			onClick={() => setShow(!isShow)}
			dataQa="qa-revisions-tab"
			tooltipText={t("git.revisions.compare-button")}
			iconCode="history"
			iconStyle={isShow ? { color: "var(--color-primary)" } : { color: "white" }}
			iconStrokeWidth="1.6"
		/>
	);
};

export default ShowRevisionsTab;
