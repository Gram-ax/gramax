import LucideIcon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

const Icon = ({ code, svg, color, className }: { code: string; svg: string; color?: string; className?: string }) => {
	if (!svg) return <LucideIcon code={code} style={{ color: color }} />;

	return <i className={className} style={{ color: color }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default styled(Icon)`
	vertical-align: middle;
	display: inline-block;
	line-height: 1px;

	svg {
		width: 1em;
		height: 1em;
	}
`;
