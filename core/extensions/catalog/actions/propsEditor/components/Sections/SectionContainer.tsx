import { FormBody, FormStack } from "@ui-kit/Form";

interface SectionContainerProps {
	children: React.ReactNode;
	stackClassName?: string;
}

export const SectionContainer = ({ children, stackClassName }: SectionContainerProps) => {
	return (
		<FormBody className="flex flex-col h-full min-h-0 flex-1 overflow-hidden grow">
			<FormStack className={stackClassName}>{children}</FormStack>
		</FormBody>
	);
};
