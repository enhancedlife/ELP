"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type BtnVariants = VariantProps<typeof buttonVariants>;

type ToolbarDropdownProps = {
	align?: "start" | "end";
	/** Shown on the icon button */
	ariaLabel: string;
	buttonClassName?: string;
	variant?: BtnVariants["variant"];
	size?: BtnVariants["size"];
	/** Icon or content inside the trigger button */
	triggerChildren: ReactNode;
	/** Dropdown panel (receives close() to dismiss) */
	children: ReactNode | ((close: () => void) => ReactNode);
	panelClassName?: string;
	panelWidth?: number;
};

/**
 * Lightweight menu anchored to a toolbar button (portal + fixed position).
 * Avoids Radix DropdownMenu modal/overlay issues that can block other header controls.
 */
export function ToolbarDropdown({
	align = "end",
	ariaLabel,
	buttonClassName,
	variant = "ghost",
	size = "icon",
	triggerChildren,
	children,
	panelClassName,
	panelWidth = 320,
}: ToolbarDropdownProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState({ top: 0, left: 0 });

	const close = useCallback(() => setOpen(false), []);

	const updatePos = useCallback(() => {
		const el = triggerRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const top = r.bottom + 8;
		const left =
			align === "end"
				? Math.max(8, r.right - panelWidth)
				: Math.min(r.left, window.innerWidth - panelWidth - 8);
		setPos({ top, left });
	}, [align, panelWidth]);

	useLayoutEffect(() => {
		if (!open) return;
		updatePos();
		const onResize = () => updatePos();
		window.addEventListener("resize", onResize);
		window.addEventListener("scroll", onResize, true);
		return () => {
			window.removeEventListener("resize", onResize);
			window.removeEventListener("scroll", onResize, true);
		};
	}, [open, updatePos]);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e: MouseEvent) => {
			const t = e.target as Node;
			if (triggerRef.current?.contains(t)) return;
			if (panelRef.current?.contains(t)) return;
			setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	const panel =
		open && typeof document !== "undefined"
			? createPortal(
					<div
						ref={panelRef}
						role="menu"
						className={cn(
							"fixed z-[200] max-h-[min(70vh,28rem)] overflow-y-auto rounded-md border bg-popover p-2 text-popover-foreground shadow-md",
							panelClassName,
						)}
						style={{
							top: pos.top,
							left: pos.left,
							width: panelWidth,
						}}
					>
						{typeof children === "function" ? children(close) : children}
					</div>,
					document.body,
				)
			: null;

	return (
		<>
			{/* Span carries ref — shadcn Button does not forward ref */}
			<span ref={triggerRef} className="inline-flex">
				<Button
					type="button"
					variant={variant}
					size={size}
					className={buttonClassName}
					aria-label={ariaLabel}
					aria-expanded={open}
					aria-haspopup="menu"
					onClick={() => setOpen((v) => !v)}
				>
					{triggerChildren}
				</Button>
			</span>
			{panel}
		</>
	);
}
