import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import styled from "@emotion/styled";
import { FormHeaderBase, FormTitle } from "@ui-kit/Form";

export interface GesFormHeaderProps<T> {
	icon: any;
	title: string;
	className?: string;
	iconProps?: T;
}

const GesFormHeader = <T = NonNullable<unknown>,>({ icon, title, className, iconProps }: GesFormHeaderProps<T>) => {
	const CustomerIcon = LucideIcon<T>(icon);

	return (
		<FormHeaderBase className={className}>
			<div className={"position-container"}>
				<CustomerIcon {...iconProps} />
				<FormTitle>{title}</FormTitle>
			</div>
		</FormHeaderBase>
	);
};

export default styled(GesFormHeader)`
	.position-container {
		align-items: center;
		padding-top: 1.5rem;
		gap: 1rem;
		flex-direction: column;
		justify-content: center;
		display: flex;
	}

	.position-container h2 {
		text-align: center;
		letter-spacing: 0;
		line-height: 28px;
		font-size: 20px;
	}
`;
