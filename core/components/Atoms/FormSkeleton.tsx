import { Form, FormBody, FormFooterBase, FormHeaderBase } from "@ui-kit/Form";
import { Skeleton } from "@ui-kit/Skeleton";
import { ReactNode } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

type FormType = UseFormReturn<FieldValues, any, FieldValues>;

interface FormSkeletonProps {
	isLoading: boolean;
	children: ReactNode;
	form: FormType;
	fieldsCount?: number;
}

const FormFieldSkeleton = () => {
	return (
		<div className="flex w-full flex-col gap-2 space-y-0 lg:flex-row lg:gap-4">
			<Skeleton className="h-8 w-44" />
			<div className="flex w-full min-w-0 flex-1 flex-col gap-y-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-5 w-44" />
			</div>
		</div>
	);
};

const FormSkeleton = ({ isLoading, children, form, fieldsCount = 8 }: FormSkeletonProps) => {
	if (!isLoading) return children;
	return (
		<div data-qa="loading">
			<Form {...form}>
				<FormHeaderBase>
					<div className="flex items-center gap-4">
						<Skeleton className="h-12 w-12" />
						<div className="flex flex-col gap-2 w-full">
							<Skeleton className="h-4 w-44" />
							<Skeleton className="h-4 w-full" />
						</div>
					</div>
				</FormHeaderBase>
				<FormBody className="flex flex-col gap-4">
					{Array.from({ length: fieldsCount }).map((_, index) => (
						<FormFieldSkeleton key={index} />
					))}
				</FormBody>
				<FormFooterBase className="flex items-center justify-end">
					<Skeleton className="h-10 w-36" />
				</FormFooterBase>
			</Form>
		</div>
	);
};

export default FormSkeleton;
