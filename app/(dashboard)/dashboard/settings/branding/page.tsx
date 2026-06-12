"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	deleteDashboardSiteFavicon,
	deleteDashboardSiteLogo,
	describeDashboardFetchFailure,
	getDashboardSiteBranding,
	patchDashboardSiteBranding,
	uploadDashboardSiteFavicon,
	uploadDashboardSiteLogo,
} from "@/lib/api/dashboard";
import {
	FALLBACK_FAVICON_URL,
	FALLBACK_LOGO_URL,
	hasCustomFavicon,
	hasCustomLogo,
	resolveFaviconUrl,
	resolveLogoUrl,
	siteDisplayName,
} from "@/lib/site-branding";
import type { SiteBranding } from "@/lib/types";

export default function BrandingSettingsPage() {
	const [branding, setBranding] = useState<SiteBranding | null>(null);
	const [siteName, setSiteName] = useState("");
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [savingName, setSavingName] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [uploadingFavicon, setUploadingFavicon] = useState(false);
	const logoInputRef = useRef<HTMLInputElement>(null);
	const faviconInputRef = useRef<HTMLInputElement>(null);

	const reload = useCallback(async () => {
		setLoading(true);
		const res = await getDashboardSiteBranding();
		if (!res.ok || !res.data) {
			setBanner(describeDashboardFetchFailure(res.status, res.errorMessage));
			setBranding(null);
		} else {
			setBanner(null);
			setBranding(res.data);
			setSiteName(res.data.site_name || "");
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	async function handleSaveName() {
		setSavingName(true);
		const res = await patchDashboardSiteBranding({ site_name: siteName.trim() });
		setSavingName(false);
		if (!res.ok || !res.data) {
			toast.error("Could not save site name", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setBranding(res.data);
		toast.success("Site name updated");
	}

	async function handleLogoUpload(file: File | undefined) {
		if (!file) return;
		setUploadingLogo(true);
		const res = await uploadDashboardSiteLogo(file);
		setUploadingLogo(false);
		if (!res.ok || !res.data) {
			toast.error("Logo upload failed", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setBranding(res.data);
		toast.success("Logo updated");
	}

	async function handleFaviconUpload(file: File | undefined) {
		if (!file) return;
		setUploadingFavicon(true);
		const res = await uploadDashboardSiteFavicon(file);
		setUploadingFavicon(false);
		if (!res.ok || !res.data) {
			toast.error("Favicon upload failed", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setBranding(res.data);
		toast.success("Favicon updated");
	}

	async function handleRemoveLogo() {
		if (!window.confirm("Remove the custom logo and use the default site logo?")) return;
		const res = await deleteDashboardSiteLogo();
		if (!res.ok || !res.data) {
			toast.error("Could not remove logo", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setBranding(res.data);
		toast.success("Custom logo removed");
	}

	async function handleRemoveFavicon() {
		if (!window.confirm("Remove the custom favicon and use the default browser icon?")) return;
		const res = await deleteDashboardSiteFavicon();
		if (!res.ok || !res.data) {
			toast.error("Could not remove favicon", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setBranding(res.data);
		toast.success("Custom favicon removed");
	}

	const logoPreview = resolveLogoUrl(branding);
	const faviconPreview = resolveFaviconUrl(branding);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Site branding</h3>
				<p className="text-sm text-muted-foreground">
					Upload the logo shown in the site header and the icon shown in browser tabs.
				</p>
			</div>
			<Separator />

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Site name</CardTitle>
					<CardDescription>
						Used for alt text and when no logo image is shown.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="site-name">Display name</Label>
						<Input
							id="site-name"
							value={siteName}
							onChange={(e) => setSiteName(e.target.value)}
							disabled={loading || savingName}
						/>
					</div>
					<Button
						type="button"
						onClick={() => void handleSaveName()}
						disabled={loading || savingName || !siteName.trim()}
					>
						{savingName ? "Saving…" : "Save site name"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Site logo</CardTitle>
					<CardDescription>
						Shown in the header and footer. PNG, JPEG, WebP, GIF, or SVG. Max 5 MB.
						{!hasCustomLogo(branding) ? " Using bundled default until you upload." : ""}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border bg-muted/40 p-6 flex items-center justify-center min-h-[80px]">
						<Image
							src={logoPreview}
							alt={siteDisplayName(branding)}
							width={240}
							height={64}
							unoptimized
							className="max-h-16 w-auto object-contain"
						/>
					</div>
					<input
						ref={logoInputRef}
						type="file"
						accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/*"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							e.target.value = "";
							void handleLogoUpload(file);
						}}
					/>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={loading || uploadingLogo}
							onClick={() => logoInputRef.current?.click()}
						>
							<ImagePlus className="h-4 w-4 mr-2" />
							{uploadingLogo ? "Uploading…" : "Upload logo"}
						</Button>
						{hasCustomLogo(branding) ? (
							<Button
								type="button"
								variant="ghost"
								className="text-destructive hover:text-destructive"
								disabled={loading || uploadingLogo}
								onClick={() => void handleRemoveLogo()}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Remove custom logo
							</Button>
						) : null}
					</div>
					<p className="text-xs text-muted-foreground">
						Default fallback: {FALLBACK_LOGO_URL}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Browser tab icon (favicon)</CardTitle>
					<CardDescription>
						Square icon shown in browser tabs and bookmarks. ICO, PNG, WebP, SVG, or GIF. Max 2 MB.
						{!hasCustomFavicon(branding) ? " Using bundled default until you upload." : ""}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border bg-muted/40 p-6 flex items-center gap-4">
						<Image
							src={faviconPreview}
							alt="Favicon preview"
							width={32}
							height={32}
							unoptimized
							className="h-8 w-8 object-contain"
						/>
						<span className="text-sm text-muted-foreground">
							Preview at 32×32 (browsers may scale differently)
						</span>
					</div>
					<input
						ref={faviconInputRef}
						type="file"
						accept=".ico,.png,.webp,.svg,.jpg,.jpeg,.gif,image/*"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							e.target.value = "";
							void handleFaviconUpload(file);
						}}
					/>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={loading || uploadingFavicon}
							onClick={() => faviconInputRef.current?.click()}
						>
							<ImagePlus className="h-4 w-4 mr-2" />
							{uploadingFavicon ? "Uploading…" : "Upload favicon"}
						</Button>
						{hasCustomFavicon(branding) ? (
							<Button
								type="button"
								variant="ghost"
								className="text-destructive hover:text-destructive"
								disabled={loading || uploadingFavicon}
								onClick={() => void handleRemoveFavicon()}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Remove custom favicon
							</Button>
						) : null}
					</div>
					<p className="text-xs text-muted-foreground">
						Default fallback: {FALLBACK_FAVICON_URL}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
