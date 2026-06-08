import { cn } from "@core-ui/utils/cn";
import { SidebarMenuSubButton } from "@ui-kit/Sidebar";

export type AdminSidebarMenuSubButtonProps = React.ComponentPropsWithoutRef<typeof SidebarMenuSubButton>;

export const AdminSidebarMenuSubButton = (props: AdminSidebarMenuSubButtonProps) => {
	const { className, children } = props;

	return (
		<SidebarMenuSubButton
			href="#"
			{...props}
			className={cn(
				"h-8 [&>svg]:text-muted [&[data-active=true]>svg]:text-primary-fg [&>svg]:hover:text-primary-fg",
				className,
			)}
		>
			{children}
		</SidebarMenuSubButton>
	);
};
