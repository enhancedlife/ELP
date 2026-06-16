"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import {
	describeDashboardFetchFailure,
	getDashboardPartnersPage,
	getDashboardSponsors,
	mutateDashboardJson,
	patchDashboardPartnersPage,
} from "@/lib/api/dashboard";
import type { PartnersPageSettings, Sponsor } from "@/lib/types";

const emptyForm = {
	name: "",
	category: "",
	website_url: "",
	logo_url: "",
	description: "",
	is_active: true,
	sort_order: 0,
};

function partnersPageToForm(p: PartnersPageSettings) {
	return {
		banner_image_url: p.banner_image_url ?? "",
		banner_kicker: p.banner_kicker ?? "",
		hero_title: p.hero_title ?? "",
		hero_lead: p.hero_lead ?? "",
		intro_heading: p.intro_heading ?? "",
		intro_body: p.intro_body ?? "",
		pillars_json: JSON.stringify(p.pillars ?? [], null, 2),
		link_primary_label: p.link_primary_label ?? "",
		link_primary_url: p.link_primary_url ?? "",
		link_secondary_label: p.link_secondary_label ?? "",
		link_secondary_url: p.link_secondary_url ?? "",
	};
}

export default function DashboardSponsorsPage() {
	const [sponsors, setSponsors] = useState<Sponsor[]>([]);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState(emptyForm);
	const [showArchived, setShowArchived] = useState(false);
	const [partnersForm, setPartnersForm] = useState(() => partnersPageToForm({
		id: 1,
		banner_image_url: "",
		banner_kicker: "SPONSORS",
		hero_title: "Your Enhanced Life Sponsors",
		hero_lead: "",
		intro_heading: "",
		intro_body: "",
		pillars: [],
		link_primary_label: "",
		link_primary_url: "",
		link_secondary_label: "",
		link_secondary_url: "",
		updated_at: "",
	}));
	const [partnersSaving, setPartnersSaving] = useState(false);

	const loadSponsors = useCallback(async () => {
		setLoading(true);
		const [spRes, pgRes] = await Promise.all([
			getDashboardSponsors(showArchived),
			getDashboardPartnersPage(),
		]);
		if (!spRes.ok || !spRes.data) {
			setBanner(describeDashboardFetchFailure(spRes.status, spRes.errorMessage));
			setSponsors([]);
		} else {
			setBanner(null);
			setSponsors(Array.isArray(spRes.data.sponsors) ? spRes.data.sponsors : []);
		}
		if (pgRes.ok && pgRes.data) {
			setPartnersForm(partnersPageToForm(pgRes.data));
		}
		setLoading(false);
	}, [showArchived]);

	useEffect(() => {
		void loadSponsors();
	}, [loadSponsors]);

	function openCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setDialogOpen(true);
	}

	function openEdit(s: Sponsor) {
		setEditingId(s.id);
		setForm({
			name: s.name,
			category: s.category ?? "",
			website_url: s.website_url ?? "",
			logo_url: s.logo_url ?? "",
			description: s.description ?? "",
			is_active: s.is_active,
			sort_order: s.sort_order,
		});
		setDialogOpen(true);
	}

	async function handleSave() {
		const name = form.name.trim();
		if (!name) {
			toast.error("Name is required.");
			return;
		}
		setSaving(true);
		const payload = {
			name,
			category: form.category.trim() || "",
			website_url: form.website_url.trim() || "",
			logo_url: form.logo_url.trim() || "",
			description: form.description.trim() || "",
			is_active: form.is_active,
			sort_order: Number(form.sort_order) || 0,
		};
		if (editingId == null) {
			const res = await mutateDashboardJson<Sponsor>("POST", "sponsors", payload);
			setSaving(false);
			if (!res.ok) {
				toast.error("Could not create sponsor", {
					description: res.errorMessage || `HTTP ${res.status}`,
				});
				return;
			}
			toast.success("Sponsor created");
		} else {
			const res = await mutateDashboardJson<Sponsor>(
				"PATCH",
				`sponsors/${editingId}`,
				payload,
			);
			setSaving(false);
			if (!res.ok) {
				toast.error("Could not update sponsor", {
					description: res.errorMessage || `HTTP ${res.status}`,
				});
				return;
			}
			toast.success("Sponsor updated");
		}
		setDialogOpen(false);
		await loadSponsors();
	}

	async function handleDelete(id: number) {
		if (
			!window.confirm(
				"Archive this sponsor? It will disappear from the public site and the default list; you can restore it when “Show archived” is on.",
			)
		) {
			return;
		}
		const res = await mutateDashboardJson<unknown>("DELETE", `sponsors/${id}`);
		if (!res.ok) {
			toast.error("Could not archive sponsor", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Sponsor archived");
		if (editingId === id) setDialogOpen(false);
		await loadSponsors();
	}

	async function handleRestore(id: number) {
		const res = await mutateDashboardJson<Sponsor>("PATCH", `sponsors/${id}`, {
			deleted_at: null,
		});
		if (!res.ok) {
			toast.error("Could not restore sponsor", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Sponsor restored");
		await loadSponsors();
	}

	const activeCount = sponsors.filter((s) => s.is_active && !s.deleted_at).length;

	async function handleSavePartnersPage() {
		let pillars: unknown;
		try {
			pillars = JSON.parse(partnersForm.pillars_json || "[]");
			if (!Array.isArray(pillars)) {
				toast.error("Pillars JSON must be an array.");
				return;
			}
		} catch {
			toast.error("Pillars must be valid JSON (array of {title, body, icon}).");
			return;
		}
		setPartnersSaving(true);
		const res = await patchDashboardPartnersPage({
			banner_image_url: partnersForm.banner_image_url.trim() || "",
			banner_kicker: partnersForm.banner_kicker.trim() || "",
			hero_title: partnersForm.hero_title.trim() || "Sponsors",
			hero_lead: partnersForm.hero_lead.trim() || "",
			intro_heading: partnersForm.intro_heading.trim() || "",
			intro_body: partnersForm.intro_body.trim() || "",
			pillars,
			link_primary_label: partnersForm.link_primary_label.trim() || "",
			link_primary_url: partnersForm.link_primary_url.trim() || "",
			link_secondary_label: partnersForm.link_secondary_label.trim() || "",
			link_secondary_url: partnersForm.link_secondary_url.trim() || "",
		});
		setPartnersSaving(false);
		if (!res.ok) {
			toast.error("Could not save sponsors page", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Sponsors page updated");
		if (res.data) setPartnersForm(partnersPageToForm(res.data));
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Sponsors</h2>
					<p className="text-muted-foreground">
						Public layout mirrors the sponsors page (banner, pillars, categories). Data from{" "}
						<code className="rounded bg-muted px-1 text-sm">GET /api/sponsors</code> and{" "}
						<code className="rounded bg-muted px-1 text-sm">/api/dashboard/partners-page</code>.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
					<div className="flex items-center gap-2 rounded-md border px-3 py-2">
						<Switch
							id="sp-archived"
							checked={showArchived}
							onCheckedChange={(v) => setShowArchived(v)}
						/>
						<Label htmlFor="sp-archived" className="text-sm font-normal cursor-pointer">
							Show archived
						</Label>
					</div>
					<Button asChild variant="outline">
						<Link href="/sponsors" target="_blank" rel="noreferrer">
							<ExternalLink className="mr-2 h-4 w-4" />
							Public page
						</Link>
					</Button>
					<Button type="button" onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Add sponsor
					</Button>
				</div>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Public sponsors page (banner &amp; copy)</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Set the hero banner image URL and text. Pillars: JSON array of{" "}
						<code className="rounded bg-muted px-1">title</code>,{" "}
						<code className="rounded bg-muted px-1">body</code>,{" "}
						<code className="rounded bg-muted px-1">icon</code> (
						<code className="rounded bg-muted px-1">handshake</code>,{" "}
						<code className="rounded bg-muted px-1">layers</code>,{" "}
						<code className="rounded bg-muted px-1">sparkles</code>,{" "}
						<code className="rounded bg-muted px-1">trending-up</code>).
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2 sm:col-span-2">
							<Label htmlFor="pp-banner">Banner image URL</Label>
							<Input
								id="pp-banner"
								value={partnersForm.banner_image_url}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, banner_image_url: e.target.value }))
								}
								placeholder="https://…"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pp-kicker">Banner kicker (small caps line)</Label>
							<Input
								id="pp-kicker"
								value={partnersForm.banner_kicker}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, banner_kicker: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pp-hero-title">Hero title</Label>
							<Input
								id="pp-hero-title"
								value={partnersForm.hero_title}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, hero_title: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2 sm:col-span-2">
							<Label htmlFor="pp-hero-lead">Hero subtitle</Label>
							<Textarea
								id="pp-hero-lead"
								rows={2}
								value={partnersForm.hero_lead}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, hero_lead: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2 sm:col-span-2">
							<Label htmlFor="pp-intro-h">Intro heading (below banner)</Label>
							<Input
								id="pp-intro-h"
								value={partnersForm.intro_heading}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, intro_heading: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2 sm:col-span-2">
							<Label htmlFor="pp-intro-b">Intro body</Label>
							<Textarea
								id="pp-intro-b"
								rows={3}
								value={partnersForm.intro_body}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, intro_body: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2 sm:col-span-2">
							<Label htmlFor="pp-pillars">Pillars (JSON array)</Label>
							<Textarea
								id="pp-pillars"
								rows={10}
								className="font-mono text-xs"
								value={partnersForm.pillars_json}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, pillars_json: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pp-p1l">Primary CTA label</Label>
							<Input
								id="pp-p1l"
								value={partnersForm.link_primary_label}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, link_primary_label: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pp-p1u">Primary CTA URL</Label>
							<Input
								id="pp-p1u"
								value={partnersForm.link_primary_url}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, link_primary_url: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pp-p2l">Secondary CTA label</Label>
							<Input
								id="pp-p2l"
								value={partnersForm.link_secondary_label}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, link_secondary_label: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="pp-p2u">Secondary CTA URL</Label>
							<Input
								id="pp-p2u"
								value={partnersForm.link_secondary_url}
								onChange={(e) =>
									setPartnersForm((f) => ({ ...f, link_secondary_url: e.target.value }))
								}
							/>
						</div>
					</div>
					<Button
						type="button"
						onClick={() => void handleSavePartnersPage()}
						disabled={partnersSaving || loading}
					>
						{partnersSaving ? "Saving…" : "Save sponsors page"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						All sponsors
						{loading ? " …" : ` (${sponsors.length}, ${activeCount} active)`}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{sponsors.length === 0 && !loading && !banner ? (
						<p className="text-sm text-muted-foreground py-4">
							No sponsor rows yet. Use <strong>Add sponsor</strong> above.
						</p>
					) : null}
					{sponsors.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Archive</TableHead>
									<TableHead>Order</TableHead>
									<TableHead>Website</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sponsors.map((s) => (
									<TableRow key={s.id}>
										<TableCell className="font-medium">{s.name}</TableCell>
										<TableCell className="max-w-[160px] truncate text-muted-foreground text-sm">
											{s.category?.trim() ? s.category : "—"}
										</TableCell>
										<TableCell>
											<Badge variant={s.is_active ? "default" : "secondary"}>
												{s.is_active ? "Active" : "Inactive"}
											</Badge>
										</TableCell>
										<TableCell>
											{s.deleted_at ? (
												<Badge variant="outline">Archived</Badge>
											) : (
												<span className="text-muted-foreground text-sm">—</span>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground">{s.sort_order}</TableCell>
										<TableCell>
											{s.website_url ? (
												<a
													href={s.website_url}
													target="_blank"
													rel="noreferrer"
													className="text-sm text-primary hover:underline truncate max-w-[200px] inline-block align-bottom"
												>
													{s.website_url}
												</a>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
										<TableCell className="text-right space-x-1">
											<Button
												variant="ghost"
												size="sm"
												type="button"
												onClick={() => openEdit(s)}
											>
												<Pencil className="h-4 w-4 mr-1" />
												Edit
											</Button>
											{s.deleted_at ? (
												<Button
													variant="ghost"
													size="sm"
													type="button"
													onClick={() => void handleRestore(s.id)}
												>
													Restore
												</Button>
											) : (
												<Button
													variant="ghost"
													size="sm"
													type="button"
													className="text-destructive hover:text-destructive"
													onClick={() => void handleDelete(s.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : null}
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{editingId == null ? "Add sponsor" : "Edit sponsor"}</DialogTitle>
						<DialogDescription>
							Changes are saved via the dashboard API and appear on the public site when active.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid gap-2">
							<Label htmlFor="sp-name">Name</Label>
							<Input
								id="sp-name"
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="sp-cat">Category (section on public page)</Label>
							<Input
								id="sp-cat"
								value={form.category}
								onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
								placeholder='e.g. Supplements & health'
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="sp-web">Website URL</Label>
							<Input
								id="sp-web"
								value={form.website_url}
								onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
								placeholder="https://"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="sp-logo">Logo URL</Label>
							<Input
								id="sp-logo"
								value={form.logo_url}
								onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
								placeholder="https://"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="sp-desc">Description</Label>
							<Textarea
								id="sp-desc"
								rows={3}
								value={form.description}
								onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="sp-order">Sort order</Label>
							<Input
								id="sp-order"
								type="number"
								value={form.sort_order}
								onChange={(e) =>
									setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
								}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								id="sp-active"
								checked={form.is_active}
								onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
							/>
							<Label htmlFor="sp-active">Active (shown on public sponsors page)</Label>
						</div>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						{editingId != null ? (
							<Button
								type="button"
								variant="destructive"
								className="mr-auto"
								onClick={() => void handleDelete(editingId)}
							>
								Archive
							</Button>
						) : null}
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={() => void handleSave()} disabled={saving}>
							{saving ? "Saving…" : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
