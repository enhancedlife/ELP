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
			<Link href="/" onClick={onClick} className={cn("inline-flex items-center shrink-0", className)}>
				<Image
					src={logoUrl}
					alt={name}
					width={400}
					height={108}
					priority
					unoptimized
					className={cn(
						"h-12 w-auto max-w-[220px] sm:h-14 sm:max-w-[280px] md:h-16 md:max-w-[320px] object-contain object-left",
						imageClassName,
					)}
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
