"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ExternalLink, ImagePlus, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  deleteDashboardBlogPost,
  deleteDashboardBlogPostThumbnail,
  describeDashboardFetchFailure,
  getDashboardBlogCommentsPendingCount,
  getDashboardBlogPosts,
  patchDashboardBlogPost,
  postDashboardBlogPost,
  uploadDashboardBlogPostThumbnail,
} from "@/lib/api/dashboard"
import { BLOG_CATEGORIES } from "@/lib/blog"
import type { BlogPostRecord } from "@/lib/types"
import type { BlogBodyBlock } from "@/lib/blog-body-blocks"
import { defaultBlogBodyBlocks, serializeBlogBody } from "@/lib/blog-body-blocks"
import { BlogBodyEditor, bodyToEditorBlocks } from "@/components/dashboard/blog-body-editor"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyForm = {
  slug: "",
  title: "",
  excerpt: "",
  category: "General",
  read_time_minutes: 5,
  image_url: "/images/article-default.jpg",
  body: "",
  published_at: toDatetimeLocalValue(new Date().toISOString()),
  is_featured: false,
  is_published: true,
  is_public: false,
  sort_order: 0,
}

type CardImageMode = "url" | "upload"

export default function DashboardBlogPostsPage() {
  const [posts, setPosts] = useState<BlogPostRecord[]>([])
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [bodyBlocks, setBodyBlocks] = useState<BlogBodyBlock[]>(defaultBlogBodyBlocks())
  const [imageMode, setImageMode] = useState<CardImageMode>("url")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [hadUploadedThumbnail, setHadUploadedThumbnail] = useState(false)
  const [pendingComments, setPendingComments] = useState(0)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  function resetImageUploadState() {
    setImageMode("url")
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setHadUploadedThumbnail(false)
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  function setPreviewFromFile(file: File) {
    setThumbnailFile(file)
    const url = URL.createObjectURL(file)
    setThumbnailPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
      return url
    })
  }

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const { ok, data, status } = await getDashboardBlogPosts({ archivedOnly: showArchived })
    if (!ok || !data) {
      setBanner(describeDashboardFetchFailure(status))
      setPosts([])
    } else {
      setBanner(null)
      setPosts(Array.isArray(data.posts) ? data.posts : [])
    }
    setLoading(false)
  }, [showArchived])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  useEffect(() => {
    void (async () => {
      const res = await getDashboardBlogCommentsPendingCount()
      if (res.ok && res.data && typeof res.data.pending_count === "number") {
        setPendingComments(res.data.pending_count)
      }
    })()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, published_at: toDatetimeLocalValue(new Date().toISOString()) })
    setBodyBlocks(defaultBlogBodyBlocks())
    resetImageUploadState()
    setDialogOpen(true)
  }

  function openEdit(p: BlogPostRecord) {
    setEditingId(p.id)
    setBodyBlocks(bodyToEditorBlocks(p.body ?? ""))
    setForm({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category || "General",
      read_time_minutes: p.read_time_minutes ?? 5,
      image_url: p.image_url || "/images/article-default.jpg",
      body: p.body ?? "",
      published_at: toDatetimeLocalValue(p.published_at),
      is_featured: p.is_featured,
      is_published: p.is_published,
      is_public: p.is_public ?? false,
      sort_order: p.sort_order ?? 0,
    })
    const thumb = p.thumbnail_url?.trim() || null
    setHadUploadedThumbnail(Boolean(thumb))
    setThumbnailFile(null)
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
    if (thumb) {
      setImageMode("upload")
      setThumbnailPreview(thumb)
    } else {
      setImageMode("url")
      setThumbnailPreview(null)
    }
    setDialogOpen(true)
  }

  async function handleSave() {
    const slug = form.slug.trim() || slugify(form.title)
    if (!slug || !form.title.trim() || !form.excerpt.trim()) {
      toast.error("Slug, title, and excerpt are required.")
      return
    }
    if (imageMode === "upload" && !thumbnailFile && !thumbnailPreview) {
      toast.error("Choose an image to upload, or switch to URL mode.")
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: serializeBlogBody(bodyBlocks),
      read_time_minutes: Number(form.read_time_minutes) || 5,
      sort_order: Number(form.sort_order) || 0,
      published_at: form.published_at
        ? new Date(form.published_at).toISOString()
        : new Date().toISOString(),
    }
    const result = editingId
      ? await patchDashboardBlogPost(editingId, payload)
      : await postDashboardBlogPost(payload)
    if (!result.ok || !result.data) {
      setSaving(false)
      toast.error(result.errorMessage ?? "Could not save post.")
      return
    }
    const postId = result.data.id

    if (imageMode === "upload") {
      if (thumbnailFile) {
        const up = await uploadDashboardBlogPostThumbnail(postId, thumbnailFile)
        if (!up.ok) {
          setSaving(false)
          toast.error(up.errorMessage ?? "Post saved but thumbnail upload failed.")
          return
        }
      }
    } else if (hadUploadedThumbnail) {
      const cleared = await deleteDashboardBlogPostThumbnail(postId)
      if (!cleared.ok) {
        setSaving(false)
        toast.error(cleared.errorMessage ?? "Post saved but could not remove uploaded image.")
        return
      }
    }

    setSaving(false)
    toast.success(editingId ? "Post updated" : "Post created")
    setDialogOpen(false)
    resetImageUploadState()
    void loadPosts()
  }

  async function handleTogglePublished(p: BlogPostRecord) {
    const next = !p.is_published
    const res = await patchDashboardBlogPost(p.id, { is_published: next })
    if (!res.ok) {
      toast.error("Could not update status", { description: res.errorMessage })
      return
    }
    toast.success(
      next ? "Post published — visible on the site" : "Post moved to draft — hidden from the site",
    )
    void loadPosts()
  }

  async function handleTogglePublic(p: BlogPostRecord) {
    const res = await patchDashboardBlogPost(p.id, { is_public: !p.is_public })
    if (!res.ok) {
      toast.error("Could not update visibility", { description: res.errorMessage })
      return
    }
    toast.success(p.is_public ? "Post is now member-only" : "Post is now public")
    void loadPosts()
  }

  async function handleRestore(id: number) {
    const res = await patchDashboardBlogPost(id, { deleted_at: null })
    if (!res.ok) {
      toast.error("Could not restore post", { description: res.errorMessage })
      return
    }
    toast.success("Post restored")
    void loadPosts()
  }

  async function handleDelete(id: number) {
    if (!confirm("Archive this blog post?")) return
    const result = await deleteDashboardBlogPost(id)
    if (!result.ok) {
      toast.error("Could not archive post.")
      return
    }
    toast.success("Post archived")
    void loadPosts()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog posts</h1>
          <p className="text-sm text-muted-foreground">
            Manage articles shown on the public blog listing and member-gated post pages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/blog-posts/comments">
              <MessageSquare className="mr-2 h-4 w-4" />
              Comments
              {pendingComments > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  {pendingComments} pending
                </Badge>
              ) : null}
            </Link>
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add post
          </Button>
        </div>
      </div>

      {banner ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {banner}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{showArchived ? "Archived posts" : "Active posts"}</CardTitle>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived only
          </label>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {showArchived ? "No archived posts." : "No blog posts yet. Create one to populate /blog."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      {p.is_featured ? <Badge variant="secondary">Featured</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      {p.deleted_at ? (
                        "—"
                      ) : p.is_published ? (
                        p.is_public ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Public</Badge>
                        ) : (
                          <Badge variant="outline">Members only</Badge>
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {p.deleted_at ? (
                        <Badge variant="outline">Archived</Badge>
                      ) : (
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={p.is_published}
                            onCheckedChange={() => void handleTogglePublished(p)}
                          />
                          <span className="whitespace-nowrap text-muted-foreground">
                            {p.is_published ? "Published" : "Draft"}
                          </span>
                        </label>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {p.is_published && !p.deleted_at ? (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : null}
                        {!p.deleted_at && p.is_published ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleTogglePublic(p)}
                          >
                            {p.is_public ? "Make private" : "Make public"}
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {p.deleted_at ? (
                          <Button variant="outline" size="sm" onClick={() => void handleRestore(p.id)}>
                            Restore
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => void handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit blog post" : "New blog post"}</DialogTitle>
            <DialogDescription>
              Build the article with blocks that match the public blog layout — justified paragraphs, colored H3
              headings, single/two-column boxes, labeled lists (Title: text), and disclaimer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: editingId ? f.slug : slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="read_time">Read time (minutes)</Label>
                <Input
                  id="read_time"
                  type="number"
                  min={1}
                  value={form.read_time_minutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, read_time_minutes: Number(e.target.value) || 5 }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border p-4">
              <Label>Card thumbnail</Label>
              <p className="text-xs text-muted-foreground">
                Shown on the blog listing cards. Upload your own image or paste a URL path.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="card-image-mode"
                    checked={imageMode === "url"}
                    onChange={() => setImageMode("url")}
                  />
                  Use image URL
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="card-image-mode"
                    checked={imageMode === "upload"}
                    onChange={() => setImageMode("upload")}
                  />
                  Upload image
                </label>
              </div>
              {imageMode === "url" ? (
                <div className="grid gap-2">
                  <Label htmlFor="image_url">Image URL or path</Label>
                  <Input
                    id="image_url"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="/images/article-example.jpg"
                  />
                  {form.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_url}
                      alt="Card preview"
                      className="mt-1 h-28 w-full max-w-xs rounded-md border object-cover"
                    />
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-2">
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setPreviewFromFile(file)
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Choose image
                    </Button>
                    {thumbnailFile || thumbnailPreview ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-muted-foreground"
                        onClick={() => {
                          setThumbnailFile(null)
                          setThumbnailPreview((prev) => {
                            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
                            return null
                          })
                          if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
                        }}
                      >
                        <X className="h-4 w-4" />
                        Clear selection
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF — max 5 MB.</p>
                  {thumbnailPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-32 w-full max-w-sm rounded-md border object-cover"
                    />
                  ) : null}
                  {!thumbnailFile && !thumbnailPreview ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Pick a file before saving, or switch back to URL mode.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="published_at">Published date</Label>
                <Input
                  id="published_at"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <BlogBodyEditor blocks={bodyBlocks} onChange={setBodyBlocks} />
            <div className="space-y-3 rounded-lg border p-4">
              <Label>Publication & visibility</Label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                />
                <span>
                  {form.is_published
                    ? "Published — visible on the site"
                    : "Draft — hidden until published"}
                </span>
              </label>
              <label
                className={`flex items-center gap-2 text-sm ${form.is_published ? "" : "opacity-50"}`}
              >
                <Switch
                  checked={form.is_public}
                  disabled={!form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_public: v }))}
                />
                Public (no login required)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                />
                Featured on /blog
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
