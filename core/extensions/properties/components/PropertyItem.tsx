import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import { useRef } from "react";

interface PropertyItemProps {
	name: string;
	id?: number;
	values?: string[] | number[];
	icon?: string;
	onClick?: (index: number, valID?: number) => void;
	className?: string;
}

const PropertyItem = ({ id, name, values, icon, onClick, className }: PropertyItemProps) => {
	const ref = useRef<HTMLDivElement>(null);

	return values ? (
		<PopupMenuLayout
			appendTo={() => ref.current}
			className="wrapper"
			placement="right-start"
			openTrigger="mouseenter focus"
			trigger={
				<div className={className}>
					<ButtonLink ref={ref} iconCode={icon} text={name} onClick={() => onClick?.(id)} />
					<Icon code="chevron-right" />
				</div>
			}
		>
			{values.map((val, index) => (
				<ButtonLink key={val} text={val} onClick={() => onClick?.(id, index)} />
			))}
		</PopupMenuLayout>
	) : (
		<ButtonLink iconCode={icon} text={name} onClick={() => onClick?.(id)} />
	);
};

export default styled(PropertyItem)`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;
