/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok */
import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import styled from "@emotion/styled";
import { FormDescription, FormHeaderBase, FormTitle } from "@ui-kit/Form";

export interface GesFormHeaderProps {
	icon: any;
	title: string;
	description?: string;
	className?: string;
	iconProps?: any;
}

const GesFormHeader = ({ icon, title, description, className, iconProps }: GesFormHeaderProps) => {
	const CustomerIcon = LucideIcon(icon);

	return (
		<FormHeaderBase className={className}>
			<div className={"position-container"}>
				<CustomerIcon {...iconProps} />
				<FormTitle>{title}</FormTitle>
				{description && <FormDescription>{description}</FormDescription>}
			</div>
		</FormHeaderBase>
	);
};

export default styled(GesFormHeader)`
	border-width: 0;
	border-color: transparent;

	.position-container {
		align-items: center;
		text-align: center;
		gap: 1rem;
		flex-direction: column;
		justify-content: center;
		display: flex;
	}

	.position-container h2 {
		letter-spacing: 0;
		line-height: 28px;
		font-size: 20px;
	}
`;
