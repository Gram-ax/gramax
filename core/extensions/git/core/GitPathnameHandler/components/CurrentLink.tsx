import Link from "@components/Atoms/Link";

const CurrentLink = ({ href }: { href: string }) => (
	<span style={{ wordBreak: "break-all", outline: "none" }} tabIndex={0}>
		<Link href={{ pathname: href }}>{decodeURIComponent(href)}</Link>
	</span>
);

export default CurrentLink;
