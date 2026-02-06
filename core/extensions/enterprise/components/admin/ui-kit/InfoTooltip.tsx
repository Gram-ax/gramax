import { IconTooltip } from "@ui-kit/IconTooltip";
import React from "react";

type InfoTooltipProps = {
	content: React.ReactNode;
	className?: string;
};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className }) => {
	return <IconTooltip className={className} content={content} icon="info" iconSize="lg" />;
};
