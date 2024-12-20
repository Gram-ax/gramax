import LucideIcon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

interface IconProps {
	code: string;
	svg?: string;
	color?: string;
	className?: string;
}

const Icon = ({ code, svg, color, className }: IconProps) => {
	if (!svg) return <LucideIcon className={className} code={code} style={{ color: color }} />;

	return <i className={className} style={{ color: color }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default styled(Icon)`
	vertical-align: middle;
	line-height: 1;
	display: inline-block;

	svg {
		width: 1em;
		height: 1em;
	}
`;
