import { classNames } from "@components/libs/classNames";
import { FormSectionTitle as UiKitFormSectionTitle } from "ics-ui-kit/components/form";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

interface UiKitFormSectionTitleProps extends ExtractComponentGeneric<typeof UiKitFormSectionTitle> {
	className?: string;
}

export const FormSectionTitle: FC<UiKitFormSectionTitleProps> = (props) => {
	const { className, ...otherProps } = props;

	return (
		<UiKitFormSectionTitle className={classNames(className, {}, ["text-primary-fg text-base"])} {...otherProps} />
	);
};
