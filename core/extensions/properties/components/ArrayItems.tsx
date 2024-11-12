import Chip from "@components/Atoms/Chip";
import styled from "@emotion/styled";
import { Property } from "@ext/properties/models";
import t from "@ext/localization/locale/translate";
import { ReactElement, ReactNode } from "react";

interface ArrayItemsProps {
	newIcon: string;
	values: Property[];
	otherIcon?: string;
	newName?: string;
	children?: ReactNode;
	className?: string;
	onClick?: (index: number) => void;
}

const ArrayItems = (props: ArrayItemsProps): ReactElement => {
	const { newName, newIcon, otherIcon, values = [], className, children, onClick } = props;
	return (
		<>
			<div className={className}>
				<Chip index={-1} name={newName || t("create-new")} icon={newIcon} onClick={onClick} />
				{values?.map((val, index) => (
					<Chip
						icon={otherIcon}
						key={val.name}
						index={index}
						name={val.name}
						chipStyle={val.style}
						onClick={onClick}
					/>
				))}
			</div>
			{children}
		</>
	);
};

export default styled(ArrayItems)`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5em;
	max-width: 100%;
	max-height: 10rem;
	overflow-y: auto;
`;
