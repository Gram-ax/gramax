import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import t from "@ext/localization/locale/translate";

const ProtectedBranch = () => {
	return (
		<div data-qa="qa-protected-branch">
			<StatusBarElement
				key={1}
				disable={true}
				iconCode="cloud"
				iconStrokeWidth="1.6"
				iconStyle={{ fontSize: "15px", opacity: 0.5 }}
				tooltipText={
					<div style={{ textAlign: "center" }}>
						<p>{t("git.publish.error.main-branch")}</p>
						<p>{t("git.publish.error.main-branch-merge")}</p>
					</div>
				}
			/>
		</div>
	);
};

export default ProtectedBranch;
