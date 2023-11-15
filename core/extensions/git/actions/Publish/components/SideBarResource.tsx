import styled from "@emotion/styled";

const SideBarResource = styled(({ title, className }: { title: string; className?: string }) => {
	return (
		<div className={"sidebar-resource-element " + className}>
			<div className="article-title">
				<span>• {title}</span>
			</div>
		</div>
	);
})`
	padding-left: 2rem !important;
	font-size: 14px;
`;

export default SideBarResource;
