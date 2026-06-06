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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	describeDashboardFetchFailure,
	deleteDashboardLandingPage,
	getDashboardLandingPages,
	mutateDashboardJson,
	patchDashboardLandingPage,
	postDashboardLandingPage,
} from "@/lib/api/dashboard";
import { faqPagePublicHref } from "@/lib/faq-nav";
import { normalizeLandingSections } from "@/lib/normalize-landing-sections";
import type { LandingPageRecord, LandingSection } from "@/lib/types";

const emptyForm = {
	slug: "",
	title: "",
	content: "",
	sections_json: "",
	meta_title: "",
	meta_description: "",
	is_active: true,
	is_faq: true,
	sort_order: 0,
	faq_nav_group: "" as "" | "sponsors",
	faq_nav_label: "",
	faq_nav_order: 0,
};

function parseSectionsJson(raw: string): LandingSection[] | null {
	const t = raw.trim();
	if (!t) return null;
	try {
		const v = JSON.parse(t) as unknown;
		if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
			return null;
		}
		return normalizeLandingSections(v);
	} catch {
		return null;
	}
}

export default function DashboardFaqPagesPage() {
	const [pages, setPages] = useState<LandingPageRecord[]>([]);
	const [banner, setBanner] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [showArchived, setShowArchived] = useState(false);
	const [faqOnly, setFaqOnly] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState(emptyForm);

	const loadPages = useCallback(async () => {
		setLoading(true);
		const { ok, data, status } = await getDashboardLandingPages({
			includeDeleted: showArchived,
			faqOnly,
		});
		if (!ok || !data) {
			setBanner(describeDashboardFetchFailure(status));
			setPages([]);
		} else {
			setBanner(null);
			setPages(Array.isArray(data.pages) ? data.pages : []);
		}
		setLoading(false);
	}, [showArchived, faqOnly]);

	useEffect(() => {
		void loadPages();
	}, [loadPages]);

	function openCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setDialogOpen(true);
	}

	function openEdit(p: LandingPageRecord) {
		setEditingId(p.id);
		setForm({
			slug: p.slug,
			title: p.title,
			content: p.content ?? "",
			sections_json: p.sections ? JSON.stringify(p.sections, null, 2) : "",
			meta_title: p.meta_title ?? "",
			meta_description: p.meta_description ?? "",
			is_active: p.is_active,
			is_faq: p.is_faq,
			sort_order: p.sort_order,
			faq_nav_group: p.faq_nav_group === "sponsors" ? "sponsors" : "",
			faq_nav_label: p.faq_nav_label ?? "",
			faq_nav_order: p.faq_nav_order ?? 0,
		});
		setDialogOpen(true);
	}

	async function handleSave() {
		const slug = form.slug.trim();
		const title = form.title.trim();
		if (!slug || !title) {
			toast.error("Slug and title are required.");
			return;
		}
		const sections = parseSectionsJson(form.sections_json);
		if (form.sections_json.trim() && sections === null) {
			toast.error("Sections must be valid JSON array or empty.");
			return;
		}
		const payload = {
			slug,
			title,
			content: form.content.trim() || null,
			sections,
			meta_title: form.meta_title.trim() || null,
			meta_description: form.meta_description.trim() || null,
			is_active: form.is_active,
			is_faq: form.is_faq,
			sort_order: Number(form.sort_order) || 0,
			faq_nav_group: form.faq_nav_group === "sponsors" ? "sponsors" : "",
			faq_nav_label: form.faq_nav_label.trim(),
			faq_nav_order: Number(form.faq_nav_order) || 0,
		};
		setSaving(true);
		if (editingId == null) {
			const res = await postDashboardLandingPage({
				slug: payload.slug,
				title: payload.title,
				content: payload.content,
				sections: payload.sections,
				meta_title: payload.meta_title,
				meta_description: payload.meta_description,
				is_active: payload.is_active,
				is_faq: payload.is_faq,
				sort_order: payload.sort_order,
				faq_nav_group: payload.faq_nav_group,
				faq_nav_label: payload.faq_nav_label,
				faq_nav_order: payload.faq_nav_order,
			});
			setSaving(false);
			if (!res.ok) {
				toast.error("Could not create page", {
					description: res.errorMessage || `HTTP ${res.status}`,
				});
				return;
			}
			toast.success("Page created");
		} else {
			const res = await patchDashboardLandingPage(editingId, payload);
			setSaving(false);
			if (!res.ok) {
				toast.error("Could not update page", {
					description: res.errorMessage || `HTTP ${res.status}`,
				});
				return;
			}
			toast.success("Page updated");
		}
		setDialogOpen(false);
		await loadPages();
	}

	async function handleArchive(id: number) {
		if (!window.confirm("Archive this page? It will disappear from the public site until restored.")) return;
		const res = await deleteDashboardLandingPage(id);
		if (!res.ok) {
			toast.error("Could not archive", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Archived");
		if (editingId === id) setDialogOpen(false);
		await loadPages();
	}

	async function handleRestore(id: number) {
		const res = await mutateDashboardJson<LandingPageRecord>("PATCH", `landing-pages/${id}`, {
			deleted_at: null,
		});
		if (!res.ok) {
			toast.error("Could not restore", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Restored");
		await loadPages();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">FAQ &amp; landing pages</h2>
					<p className="text-muted-foreground text-sm mt-1">
						CMS pages served from Django. Mark <strong>FAQ</strong> to show on the public{" "}
						<Link href="/faq" className="text-primary underline">
							/faq
						</Link>{" "}
						hub. Use slug <code className="rounded bg-muted px-1">faq</code> for the main FAQ intro, or{" "}
						<code className="rounded bg-muted px-1">faq-topic</code> for{" "}
						<code className="rounded bg-muted px-1">/faq/topic</code>. Set{" "}
						<strong>FAQ menu → Sponsors</strong> and a label to list a page under{" "}
						<strong>Sponsors&apos; FAQ</strong> in the site header (requires active FAQ topic).
					</p>
				</div>
				<Button type="button" onClick={openCreate}>
					<Plus className="mr-2 h-4 w-4" />
					New page
				</Button>
			</div>

			<div className="flex flex-wrap gap-4">
				<div className="flex items-center gap-2 rounded-md border px-3 py-2">
					<Switch id="lp-faq" checked={faqOnly} onCheckedChange={(v) => setFaqOnly(v)} />
					<Label htmlFor="lp-faq" className="text-sm font-normal cursor-pointer">
						FAQ pages only
					</Label>
				</div>
				<div className="flex items-center gap-2 rounded-md border px-3 py-2">
					<Switch id="lp-arch" checked={showArchived} onCheckedChange={(v) => setShowArchived(v)} />
					<Label htmlFor="lp-arch" className="text-sm font-normal cursor-pointer">
						Show archived
					</Label>
				</div>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>
						Pages
						{loading ? " …" : ` (${pages.length})`}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{pages.length === 0 && !loading && !banner ? (
						<p className="text-sm text-muted-foreground py-4">No rows match the filters.</p>
					) : null}
					{pages.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Slug</TableHead>
									<TableHead>Title</TableHead>
									<TableHead>FAQ</TableHead>
									<TableHead>Header menu</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Order</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pages.map((p) => (
									<TableRow key={p.id}>
										<TableCell className="font-mono text-xs">{p.slug}</TableCell>
										<TableCell className="font-medium">{p.title}</TableCell>
										<TableCell>
											{p.is_faq ? <Badge variant="secondary">FAQ</Badge> : <span className="text-muted-foreground">—</span>}
										</TableCell>
										<TableCell className="text-sm">
											{p.faq_nav_group === "sponsors" && p.is_faq ? (
												<span className="text-muted-foreground" title={p.faq_nav_label || p.title}>
													Sponsors: {(p.faq_nav_label ?? "").trim() || p.title}
												</span>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
										<TableCell>
											{p.deleted_at ? (
												<Badge variant="outline">Archived</Badge>
											) : p.is_active ? (
												<Badge>Active</Badge>
											) : (
												<Badge variant="secondary">Draft</Badge>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground">{p.sort_order}</TableCell>
										<TableCell className="text-right space-x-1">
											<Button variant="ghost" size="sm" type="button" asChild>
												<a href={faqPagePublicHref(p.slug)} target="_blank" rel="noreferrer">
													<ExternalLink className="h-4 w-4" />
												</a>
											</Button>
											<Button variant="ghost" size="sm" type="button" onClick={() => openEdit(p)}>
												<Pencil className="h-4 w-4 mr-1" />
												Edit
											</Button>
											{p.deleted_at ? (
												<Button variant="ghost" size="sm" type="button" onClick={() => void handleRestore(p.id)}>
													Restore
												</Button>
											) : (
												<Button
													variant="ghost"
													size="sm"
													type="button"
													className="text-destructive"
													onClick={() => void handleArchive(p.id)}
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
				<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingId == null ? "New page" : "Edit page"}</DialogTitle>
						<DialogDescription>
							HTML in content is rendered on the public site. Sections JSON drives FAQ-style blocks.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 py-2">
						<div className="grid gap-2">
							<Label htmlFor="lp-slug">Slug</Label>
							<Input
								id="lp-slug"
								value={form.slug}
								onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
								placeholder="faq or faq-shipping"
								disabled={editingId != null}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="lp-title">Title</Label>
							<Input
								id="lp-title"
								value={form.title}
								onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="lp-content">Content (HTML)</Label>
							<Textarea
								id="lp-content"
								rows={5}
								value={form.content}
								onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="lp-sections">Sections (JSON, optional)</Label>
							<Textarea
								id="lp-sections"
								rows={4}
								className="font-mono text-xs"
								value={form.sections_json}
								onChange={(e) => setForm((f) => ({ ...f, sections_json: e.target.value }))}
								placeholder='{"categories":[{"title":"Shipping","items":[{"question":"…","answer":"line1\\n1. step\\n2. step"}]}]}'
							/>
						</div>
						<div className="grid gap-2 sm:grid-cols-2">
							<div className="grid gap-2">
								<Label htmlFor="lp-meta-t">Meta title</Label>
								<Input
									id="lp-meta-t"
									value={form.meta_title}
									onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="lp-order">Sort order</Label>
								<Input
									id="lp-order"
									type="number"
									value={form.sort_order}
									onChange={(e) =>
										setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
									}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="lp-meta-d">Meta description</Label>
							<Textarea
								id="lp-meta-d"
								rows={2}
								value={form.meta_description}
								onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
							/>
						</div>
						<div className="flex flex-wrap gap-6">
							<div className="flex items-center gap-2">
								<Switch
									id="lp-active"
									checked={form.is_active}
									onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
								/>
								<Label htmlFor="lp-active">Active (public)</Label>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									id="lp-faq2"
									checked={form.is_faq}
									onCheckedChange={(v) => setForm((f) => ({ ...f, is_faq: v }))}
								/>
								<Label htmlFor="lp-faq2">FAQ hub topic</Label>
							</div>
						</div>
						<div className="rounded-lg border bg-muted/30 p-3 space-y-3">
							<p className="text-sm font-medium">Site header — FAQ dropdown</p>
							<p className="text-xs text-muted-foreground">
								<strong>Generic FAQ</strong> is the main <code className="rounded bg-muted px-1">/faq</code> hub. To add a row under{" "}
								<strong>Sponsors&apos; FAQ</strong>, turn on FAQ hub topic, set group to Sponsors, and use a slug like{" "}
								<code className="rounded bg-muted px-1">faq-aquila</code> → public URL{" "}
								<code className="rounded bg-muted px-1">{faqPagePublicHref("faq-aquila")}</code>.
							</p>
							<div className="grid gap-2">
								<Label htmlFor="lp-faq-nav-group">FAQ menu group</Label>
								<Select
									value={form.faq_nav_group || "generic"}
									onValueChange={(v) =>
										setForm((f) => ({
											...f,
											faq_nav_group: v === "sponsors" ? "sponsors" : "",
											...(v === "sponsors" ? { is_faq: true } : {}),
										}))
									}
								>
									<SelectTrigger id="lp-faq-nav-group">
										<SelectValue placeholder="Choose group" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="generic">Generic (hub only — not under Sponsors&apos; FAQ)</SelectItem>
										<SelectItem value="sponsors">Sponsors&apos; FAQ (show in header submenu)</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="lp-faq-nav-label">Menu label</Label>
									<Input
										id="lp-faq-nav-label"
										value={form.faq_nav_label}
										onChange={(e) => setForm((f) => ({ ...f, faq_nav_label: e.target.value }))}
										placeholder='e.g. "Aquila Anabolics FAQ"'
										disabled={form.faq_nav_group !== "sponsors"}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="lp-faq-nav-order">Submenu order</Label>
									<Input
										id="lp-faq-nav-order"
										type="number"
										value={form.faq_nav_order}
										onChange={(e) =>
											setForm((f) => ({ ...f, faq_nav_order: Number(e.target.value) || 0 }))
										}
										disabled={form.faq_nav_group !== "sponsors"}
									/>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						{editingId != null ? (
							<Button
								type="button"
								variant="destructive"
								className="mr-auto"
								onClick={() => void handleArchive(editingId)}
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
