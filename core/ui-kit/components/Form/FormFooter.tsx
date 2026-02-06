import { classNames } from "@components/libs/classNames";
import t from "@ext/localization/locale/translate";
import { useMediaQuery } from "@react-hook/media-query";
import { Button } from "@ui-kit/Button";
import { FormFooter as UiKitFormFooter } from "ics-ui-kit/components/form";
import type { FC, ReactNode } from "react";
import { tv } from "tailwind-variants";

const formFooterTemplateStyles = tv({
	slots: {
		container: "flex w-full gap-3",
		startBlock: "flex items-center",
		endBlock: "ml-auto flex w-full flex-col gap-3 lg:w-auto lg:flex-row",
	},
	variants: {
		isMobile: {
			true: {
				container: "flex-col-reverse",
			},
			false: {
				container: "flex-col lg:flex-row",
			},
		},
	},
});

interface FormFooterTemplateProps {
	className?: string;
	checkboxLabel?: string;
	primaryButton?: ReactNode;
	secondaryButton?: ReactNode;
}

interface FormHeaderTemplateProps extends FormFooterTemplateProps {
	leftContent?: ReactNode;
}

const breakpoints = {
	sm: "640px",
	md: "768px",
	lg: "1024px",
	xl: "1280px",
	"2xl": "1536px",
} as const;

const useIsLg = () => useMediaQuery(`(min-width: ${breakpoints.lg})`);
const useIsMobile = () => !useIsLg();

export const FormFooter: FC<FormHeaderTemplateProps> = (props) => {
	const { leftContent, className, primaryButton, secondaryButton } = props;

	const isMobile = useIsMobile();
	const { container, endBlock } = formFooterTemplateStyles({ isMobile });

	const rightButton = primaryButton || (
		<Button disabled type="submit" variant="primary">
			{t("add")}
		</Button>
	);

	return (
		<UiKitFormFooter className={className}>
			<div className={container()}>
				{leftContent}
				<div className={classNames(endBlock(), {}, [isMobile ? "flex-col-reverse" : "flex-row"])}>
					{secondaryButton}
					{rightButton}
				</div>
			</div>
		</UiKitFormFooter>
	);
};
