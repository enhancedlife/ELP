"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BlogArticleBody } from "@/components/blog-article-body"
import {
  BLOG_ACCENT_COLOR_OPTIONS,
  BLOG_BLOCK_LABELS,
  blogBlocksToHtml,
  createEmptyBlock,
  serializeBlogBody,
  parseBlogBody,
  type BlogAccentColor,
  type BlogBodyBlock,
  type BlogLabeledItem,
  type BlogPromoItem,
} from "@/lib/blog-body-blocks"

type BlogBodyEditorProps = {
  blocks: BlogBodyBlock[]
  onChange: (blocks: BlogBodyBlock[]) => void
}

function AccentColorSelect({
  value,
  onChange,
  label,
}: {
  value?: BlogAccentColor
  onChange: (color: BlogAccentColor) => void
  label: string
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value ?? "green"} onValueChange={(v) => onChange(v as BlogAccentColor)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BLOG_ACCENT_COLOR_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function LabeledItemRows({
  items,
  onChange,
}: {
  items: BlogLabeledItem[]
  onChange: (items: BlogLabeledItem[]) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            className="w-1/3"
            value={item.label ?? ""}
            onChange={(e) => {
              const next = [...items]
              next[i] = { ...next[i], label: e.target.value }
              onChange(next)
            }}
            placeholder="Title (optional)"
          />
          <Input
            className="flex-1"
            value={item.text}
            onChange={(e) => {
              const next = [...items]
              next[i] = { ...next[i], text: e.target.value }
              onChange(next)
            }}
            placeholder="Text after colon"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={items.length <= 1}
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { label: "", text: "" }])}
      >
        Add row
      </Button>
    </div>
  )
}

function moveItem<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const next = [...items]
  const target = index + dir
  if (target < 0 || target >= next.length) return items
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function PromoItemRows({
  items,
  onChange,
}: {
  items: BlogPromoItem[]
  onChange: (items: BlogPromoItem[]) => void
}) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border bg-muted/10 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Coupon {i + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={i === 0}
                onClick={() => onChange(moveItem(items, i, -1))}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={i === items.length - 1}
                onClick={() => onChange(moveItem(items, i, 1))}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                disabled={items.length <= 1}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input
            value={item.title}
            onChange={(e) => {
              const next = [...items]
              next[i] = { ...next[i], title: e.target.value }
              onChange(next)
            }}
            placeholder="Coupon title or code (e.g. GREATLIFE50)"
            className="font-mono"
          />
          <AccentColorSelect
            label="Title / code color"
            value={item.titleColor}
            onChange={(titleColor) => {
              const next = [...items]
              next[i] = { ...next[i], titleColor }
              onChange(next)
            }}
          />
          <Textarea
            rows={2}
            value={item.detail}
            onChange={(e) => {
              const next = [...items]
              next[i] = { ...next[i], detail: e.target.value }
              onChange(next)
            }}
            placeholder="Discount details (shown in standard gray text)"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...items, { title: "", titleColor: "orange", detail: "" }])
        }
      >
        Add coupon
      </Button>
    </div>
  )
}

function moveBlock(blocks: BlogBodyBlock[], index: number, dir: -1 | 1): BlogBodyBlock[] {
  const next = [...blocks]
  const target = index + dir
  if (target < 0 || target >= next.length) return blocks
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function updateBlock(blocks: BlogBodyBlock[], index: number, block: BlogBodyBlock): BlogBodyBlock[] {
  return blocks.map((b, i) => (i === index ? block : b))
}

function BlockFields({
  block,
  onChange,
}: {
  block: BlogBodyBlock
  onChange: (block: BlogBodyBlock) => void
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <Textarea
          rows={3}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Opening paragraph or body text…"
        />
      )
    case "heading2":
      return (
        <Input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Section title"
        />
      )
    case "heading3":
      return (
        <div className="space-y-3">
          <Input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Subheading text"
          />
          <AccentColorSelect
            label="Heading color"
            value={block.color}
            onChange={(color) => onChange({ ...block, color })}
          />
        </div>
      )
    case "bullet_list":
      return (
        <Textarea
          rows={5}
          value={block.items.join("\n")}
          onChange={(e) =>
            onChange({
              ...block,
              items: e.target.value.split("\n"),
            })
          }
          placeholder="One bullet per line (• optional)"
        />
      )
    case "labeled_list":
      return (
        <div className="space-y-3">
          <AccentColorSelect
            label="Label color (title before colon)"
            value={block.labelColor}
            onChange={(labelColor) => onChange({ ...block, labelColor })}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={block.inBox ?? false}
              onChange={(e) => onChange({ ...block, inBox: e.target.checked })}
            />
            Wrap in shaded box (like sleep article highlights)
          </label>
          <LabeledItemRows
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
          />
        </div>
      )
    case "box":
      return (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Box heading (H3, optional)</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="e.g. Research Highlights:"
            />
          </div>
          <AccentColorSelect
            label="Box heading color"
            value={block.titleColor}
            onChange={(titleColor) => onChange({ ...block, titleColor })}
          />
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Intro text (optional)</Label>
            <Textarea
              rows={2}
              value={block.intro ?? ""}
              onChange={(e) => onChange({ ...block, intro: e.target.value })}
              placeholder="Short intro inside the box…"
            />
          </div>
          <AccentColorSelect
            label="List label color"
            value={block.labelColor}
            onChange={(labelColor) => onChange({ ...block, labelColor })}
          />
          <Label className="text-xs text-muted-foreground">List items (title + text, or bullet only)</Label>
          <LabeledItemRows
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
          />
        </div>
      )
    case "two_column":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {block.columns.map((col, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <Label className="text-xs text-muted-foreground">Column {i + 1}</Label>
              <Input
                value={col.title}
                onChange={(e) => {
                  const columns = [...block.columns] as typeof block.columns
                  columns[i] = { ...columns[i], title: e.target.value }
                  onChange({ ...block, columns })
                }}
                placeholder="Box title (H3)"
              />
              <AccentColorSelect
                label="Title color"
                value={col.titleColor}
                onChange={(titleColor) => {
                  const columns = [...block.columns] as typeof block.columns
                  columns[i] = { ...columns[i], titleColor }
                  onChange({ ...block, columns })
                }}
              />
              <Textarea
                rows={3}
                value={col.body}
                onChange={(e) => {
                  const columns = [...block.columns] as typeof block.columns
                  columns[i] = { ...columns[i], body: e.target.value }
                  onChange({ ...block, columns })
                }}
                placeholder="Box body text"
              />
            </div>
          ))}
        </div>
      )
    case "three_column":
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          {block.columns.map((col, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <Label className="text-xs text-muted-foreground">Column {i + 1}</Label>
              <Input
                value={col.title}
                onChange={(e) => {
                  const columns = [...block.columns] as typeof block.columns
                  columns[i] = { ...columns[i], title: e.target.value }
                  onChange({ ...block, columns })
                }}
                placeholder="Box title (H3)"
              />
              <AccentColorSelect
                label="Title color"
                value={col.titleColor}
                onChange={(titleColor) => {
                  const columns = [...block.columns] as typeof block.columns
                  columns[i] = { ...columns[i], titleColor }
                  onChange({ ...block, columns })
                }}
              />
              <Textarea
                rows={3}
                value={col.body}
                onChange={(e) => {
                  const columns = [...block.columns] as typeof block.columns
                  columns[i] = { ...columns[i], body: e.target.value }
                  onChange({ ...block, columns })
                }}
                placeholder="Box body text"
              />
            </div>
          ))}
        </div>
      )
    case "promo_code":
      return (
        <div className="space-y-3">
          <Input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Label above code (e.g. Exclusive Community Code)"
          />
          <Input
            value={block.code}
            onChange={(e) => onChange({ ...block, code: e.target.value })}
            placeholder="Promo code"
            className="font-mono"
          />
          <AccentColorSelect
            label="Code color"
            value={block.codeColor}
            onChange={(codeColor) => onChange({ ...block, codeColor })}
          />
          <Textarea
            rows={2}
            value={block.description}
            onChange={(e) => onChange({ ...block, description: e.target.value })}
            placeholder="Short description under the code"
          />
        </div>
      )
    case "promo_list":
      return (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Box heading (optional)</Label>
            <Input
              value={block.boxLabel ?? ""}
              onChange={(e) => onChange({ ...block, boxLabel: e.target.value })}
              placeholder="e.g. Exclusive Community Codes"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Add coupons in display order — each title/code can use its own color; details use
            standard gray on the public page.
          </p>
          <PromoItemRows
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
          />
        </div>
      )
    case "cta_link":
      return (
        <div className="space-y-3">
          <Input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Button label"
          />
          <Input
            value={block.href}
            onChange={(e) => onChange({ ...block, href: e.target.value })}
            placeholder="/contact or https://…"
          />
          <Select
            value={block.variant ?? "outline"}
            onValueChange={(v) => onChange({ ...block, variant: v as "primary" | "outline" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Green solid button</SelectItem>
              <SelectItem value="outline">Outline button</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    case "disclaimer":
      return (
        <div className="space-y-2">
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Disclaimer title"
          />
          <Textarea
            rows={3}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Disclaimer text…"
          />
        </div>
      )
    case "raw_html":
      return (
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={block.html}
          onChange={(e) => onChange({ ...block, html: e.target.value })}
        />
      )
  }
}

export function BlogBodyEditor({ blocks, onChange }: BlogBodyEditorProps) {
  const previewHtml = blogBlocksToHtml(blocks)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Article content</Label>
        <Select
          onValueChange={(type) =>
            onChange([...blocks, createEmptyBlock(type as BlogBodyBlock["type"])])
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Add block…" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(BLOG_BLOCK_LABELS) as BlogBodyBlock["type"][])
              .filter((t) => t !== "raw_html")
              .map((type) => (
                <SelectItem key={type} value={type}>
                  {BLOG_BLOCK_LABELS[type]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {blocks.map((block, index) => (
            <div key={block.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {BLOG_BLOCK_LABELS[block.type]}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => onChange(moveBlock(blocks, index, -1))}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === blocks.length - 1}
                    onClick={() => onChange(moveBlock(blocks, index, 1))}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    disabled={blocks.length <= 1}
                    onClick={() => onChange(blocks.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <BlockFields
                block={block}
                onChange={(next) => onChange(updateBlock(blocks, index, next))}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preview (matches public blog)</Label>
          <div className="rounded-xl border bg-[#0a0f0a] p-5 max-h-[420px] overflow-y-auto">
            {previewHtml ? (
              <BlogArticleBody body={serializeBlogBody(blocks)} />
            ) : (
              <p className="text-sm text-gray-500">Add blocks to see preview…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function bodyToEditorBlocks(body: string): BlogBodyBlock[] {
  const parsed = parseBlogBody(body)
  if (parsed?.length) return parsed
  if (body.trim()) {
    return [{ ...createEmptyBlock("raw_html"), html: body }]
  }
  return [createEmptyBlock("paragraph")]
}
