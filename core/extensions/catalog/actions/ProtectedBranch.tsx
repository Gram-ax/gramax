import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";

const ProtectedBranch = ({ text }: { text: string }) => {
	return (
		<div data-qa="qa-protected-branch">
			<StatusBarElement
				disable
				iconCode="custom-cloud-up"
				iconStrokeWidth="1.6"
				iconStyle={{ fontSize: "15px", opacity: 0.5, fill: "white" }}
				tooltipText={
					<div style={{ textAlign: "center" }}>
						<p>{text}</p>
					</div>
				}
			/>
		</div>
	);
};

export default ProtectedBranch;
