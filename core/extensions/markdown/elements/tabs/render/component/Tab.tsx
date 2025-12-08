import Icon from "@components/Atoms/Icon";
import { ReactElement } from "react";

type TabProps = {
	idx: number;
	name?: string;
	icon?: string;
	isPrint?: boolean;
	children?: ReactElement;
};

const Tab = ({ idx, name, icon, isPrint, children }: TabProps): ReactElement => {
	if (isPrint) {
		return (
			<div className="tab">
				<div className="case">
					{icon && <Icon code={icon} style={{ marginRight: "0.2em" }} />}
					{name && <strong>{name}</strong>}
				</div>
				<div className="content">{children}</div>
			</div>
		);
	}

	return <div className={`tab c-${idx}`}>{children}</div>;
};

export default Tab;
