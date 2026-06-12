import Link from "next/link";
import Image from "next/image";
import type { SiteBranding } from "@/lib/types";
import { resolveLogoUrl, siteDisplayName } from "@/lib/site-branding";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
	branding?: SiteBranding | null;
	className?: string;
	imageClassName?: string;
	textClassName?: string;
	preferText?: boolean;
	onClick?: () => void;
};

export function SiteLogo({
	branding,
	className,
	imageClassName,
	textClassName,
	preferText = false,
	onClick,
}: SiteLogoProps) {
	const name = siteDisplayName(branding);
	const logoUrl = resolveLogoUrl(branding);
	const showImage = !preferText && Boolean(logoUrl);

	if (showImage) {
		return (
			<Link href="/" onClick={onClick} className={cn("inline-flex items-center", className)}>
				<Image
					src={logoUrl}
					alt={name}
					width={200}
					height={48}
					unoptimized
					className={cn("h-8 w-auto max-w-[200px] object-contain object-left", imageClassName)}
				/>
			</Link>
		);
	}

	return (
		<Link
			href="/"
			onClick={onClick}
			className={cn(
				"font-heading font-bold uppercase tracking-wider hover:text-green-400 transition",
				textClassName,
				className,
			)}
		>
			{name}
		</Link>
	);
}
