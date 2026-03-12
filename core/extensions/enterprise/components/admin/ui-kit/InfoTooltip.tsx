import { IconTooltip } from "@ui-kit/IconTooltip";
import type React from "react";

type InfoTooltipProps = {
	content: React.ReactNode;
	className?: string;
};

export const InfoTooltip = ({ content, className }: InfoTooltipProps) => {
	return <IconTooltip className={className} content={content} icon="info" iconSize="lg" />;
};
