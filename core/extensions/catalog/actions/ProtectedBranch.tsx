import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import t from "@ext/localization/locale/translate";

const ProtectedBranch = () => {
	return (
		<div data-qa="qa-protected-branch">
			<StatusBarElement
				disable
				iconCode="custom-cloud-up"
				iconStrokeWidth="1.6"
				iconStyle={{ fontSize: "15px", opacity: 0.5, fill: "white" }}
				tooltipText={
					<div style={{ textAlign: "center" }}>
						<p>{t("git.publish.error.main-branch")}</p>
					</div>
				}
			/>
		</div>
	);
};

export default ProtectedBranch;
