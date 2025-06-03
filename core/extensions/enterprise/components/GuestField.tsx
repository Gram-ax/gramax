import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";

interface GuestFieldProps {
	description: string;
	children: React.ReactNode;
	className?: string;
}

const GuestField = ({ description, children, className }: GuestFieldProps) => (
	<div className={classNames(className, {}, ["form-group"])}>
		<div className="field field-string row">
			<div className="input-lable">{children}</div>
		</div>
		{description && (
			<div className="input-lable-description">
				<div className="article">{description}</div>
			</div>
		)}
	</div>
);

export default styled(GuestField)`
	margin-bottom: 1.5em;

	.input-lable {
		max-width: unset;
		flex: unset;
		min-width: 100%;
	}

	.article {
		max-width: unset;
		flex: unset;
		min-width: 100%;
	}
`;
