"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Search, Send, MessageSquarePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	deleteDashboardConversation,
	deleteDashboardMessage,
	describeDashboardFetchFailure,
	getDashboardConversation,
	getDashboardMessagesInbox,
	postDashboardConversationReply,
	postDashboardNewConversation,
} from "@/lib/api/dashboard";
import type {
	DashboardConversationRow,
	DashboardMessageRow,
} from "@/lib/types/dashboard";

export default function MessagesPage() {
	const [conversations, setConversations] = useState<DashboardConversationRow[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [threadSubject, setThreadSubject] = useState("");
	const [messages, setMessages] = useState<DashboardMessageRow[]>([]);
	const [banner, setBanner] = useState<string | null>(null);
	const [loadingInbox, setLoadingInbox] = useState(true);
	const [loadingThread, setLoadingThread] = useState(false);
	const [composer, setComposer] = useState("");
	const [sending, setSending] = useState(false);
	const [search, setSearch] = useState("");
	const [newOpen, setNewOpen] = useState(false);
	const [newSubject, setNewSubject] = useState("");
	const [newBody, setNewBody] = useState("");

	const loadInbox = useCallback(async () => {
		setLoadingInbox(true);
		const { ok, data, status, errorMessage } = await getDashboardMessagesInbox();
		if (!ok || !data) {
			setBanner(describeDashboardFetchFailure(status, errorMessage));
			setConversations([]);
		} else {
			setBanner(null);
			setConversations(Array.isArray(data.conversations) ? data.conversations : []);
		}
		setLoadingInbox(false);
	}, []);

	const loadThread = useCallback(async (id: number) => {
		setLoadingThread(true);
		const { ok, data, status } = await getDashboardConversation(id);
		if (!ok || !data) {
			toast.error("Could not load thread", {
				description: describeDashboardFetchFailure(status),
			});
			setMessages([]);
			setThreadSubject("");
		} else {
			setThreadSubject(data.conversation.subject);
			setMessages(Array.isArray(data.messages) ? data.messages : []);
		}
		setLoadingThread(false);
	}, []);

	useEffect(() => {
		void loadInbox();
	}, [loadInbox]);

	useEffect(() => {
		if (selectedId != null) {
			void loadThread(selectedId);
		} else {
			setMessages([]);
			setThreadSubject("");
		}
	}, [selectedId, loadThread]);

	const filtered = conversations.filter((c) => {
		const q = search.trim().toLowerCase();
		if (!q) return true;
		return (
			c.subject.toLowerCase().includes(q) ||
			c.preview.toLowerCase().includes(q)
		);
	});

	async function sendReply() {
		const text = composer.trim();
		if (selectedId == null || !text) return;
		setSending(true);
		const res = await postDashboardConversationReply(selectedId, {
			body: text,
			author_label: "You",
		});
		setSending(false);
		if (!res.ok || !res.data) {
			toast.error("Send failed", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setComposer("");
		setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
		await loadInbox();
	}

	async function createThread() {
		const body = newBody.trim();
		if (!body) {
			toast.error("Message is required");
			return;
		}
		const res = await postDashboardNewConversation({
			subject: newSubject.trim() || "New conversation",
			body,
			author_label: "You",
		});
		if (!res.ok || !res.data?.id) {
			toast.error("Could not start conversation", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		setNewOpen(false);
		setNewSubject("");
		setNewBody("");
		await loadInbox();
		setSelectedId(res.data.id);
		toast.success("Conversation started");
	}

	async function archiveThread() {
		if (selectedId == null) return;
		if (
			!window.confirm(
				"Archive this entire conversation? It will disappear from the inbox (soft delete).",
			)
		) {
			return;
		}
		const res = await deleteDashboardConversation(selectedId);
		if (!res.ok) {
			toast.error("Could not archive conversation", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Conversation archived");
		setSelectedId(null);
		await loadInbox();
	}

	async function archiveMessage(messageId: number) {
		if (selectedId == null) return;
		const res = await deleteDashboardMessage(selectedId, messageId);
		if (!res.ok) {
			toast.error("Could not archive message", {
				description: res.errorMessage || `HTTP ${res.status}`,
			});
			return;
		}
		toast.success("Message archived");
		await loadThread(selectedId);
		await loadInbox();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Messages</h2>
					<p className="text-muted-foreground">
						Internal threads stored in the database and loaded via{" "}
						<code className="rounded bg-muted px-1 text-sm">GET/POST /api/dashboard/messages</code>
						. Open{" "}
						<Link href="/dashboard/settings/notifications" className="text-primary underline">
							Settings → Notifications
						</Link>{" "}
						for alerts.
					</p>
				</div>
				<Button type="button" onClick={() => setNewOpen(true)}>
					<MessageSquarePlus className="mr-2 h-4 w-4" />
					New conversation
				</Button>
			</div>

			{banner ? (
				<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
					{banner}
				</p>
			) : null}

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Conversations</CardTitle>
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search…"
								className="pl-8"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</CardHeader>
					<CardContent className="space-y-1 max-h-[480px] overflow-y-auto">
						{loadingInbox ? (
							<p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
						) : filtered.length === 0 ? (
							<p className="text-sm text-muted-foreground py-6 text-center">
								No conversations yet. Start one above.
							</p>
						) : (
							filtered.map((c) => (
								<button
									key={c.id}
									type="button"
									onClick={() => setSelectedId(c.id)}
									className={cn(
										"w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/80",
										selectedId === c.id && "border-primary bg-primary/5",
									)}
								>
									<div className="font-medium line-clamp-1">{c.subject}</div>
									<div className="text-xs text-muted-foreground line-clamp-2 mt-1">
										{c.preview || "—"}
									</div>
									<div className="text-[10px] text-muted-foreground mt-2">
										{new Date(c.updated_at).toLocaleString()} · {c.message_count} msgs
									</div>
								</button>
							))
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
						<CardTitle className="text-lg">
							{selectedId != null ? threadSubject || "Thread" : "Select a conversation"}
						</CardTitle>
						{selectedId != null ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="text-destructive hover:text-destructive"
								onClick={() => void archiveThread()}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Archive thread
							</Button>
						) : null}
					</CardHeader>
					<CardContent>
						<div className="flex h-[400px] flex-col border rounded-lg bg-muted/10">
							<div className="flex-1 overflow-y-auto p-4 space-y-4">
								{selectedId == null ? (
									<p className="text-sm text-muted-foreground text-center py-16">
										Choose a thread on the left or start a new conversation.
									</p>
								) : loadingThread ? (
									<p className="text-sm text-muted-foreground text-center py-16">
										Loading messages…
									</p>
								) : (
									messages.map((m) => (
										<div
											key={m.id}
											className="rounded-lg border bg-background px-3 py-2 shadow-sm"
										>
											<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
												<span className="font-medium text-foreground">
													{m.author_label}
												</span>
												<span className="flex items-center gap-1">
													<span>{new Date(m.created_at).toLocaleString()}</span>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
														aria-label="Archive message"
														onClick={() => void archiveMessage(m.id)}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</span>
											</div>
											<p className="text-sm mt-2 whitespace-pre-wrap">{m.body}</p>
										</div>
									))
								)}
							</div>
							<div className="border-t p-3 flex gap-2">
								<Input
									placeholder={
										selectedId != null
											? "Write a reply…"
											: "Select a conversation to reply"
									}
									className="flex-1"
									value={composer}
									onChange={(e) => setComposer(e.target.value)}
									disabled={selectedId == null}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											void sendReply();
										}
									}}
								/>
								<Button
									type="button"
									size="icon"
									disabled={selectedId == null || sending || !composer.trim()}
									onClick={() => void sendReply()}
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog open={newOpen} onOpenChange={setNewOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New conversation</DialogTitle>
					</DialogHeader>
					<div className="grid gap-3 py-2">
						<div className="grid gap-2">
							<Label htmlFor="thr-subj">Subject</Label>
							<Input
								id="thr-subj"
								value={newSubject}
								onChange={(e) => setNewSubject(e.target.value)}
								placeholder="e.g. Sponsor outreach"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="thr-body">First message</Label>
							<Input
								id="thr-body"
								value={newBody}
								onChange={(e) => setNewBody(e.target.value)}
								placeholder="Your message…"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={() => void createThread()}>
							Start
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
