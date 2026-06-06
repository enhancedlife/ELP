'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LogIn, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginRequest } from '@/lib/auth';

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called after a successful sign-in (e.g. refresh portal auth). */
	onSuccess?: () => void;
};

export function MemberToolsLoginModal({ open, onOpenChange, onSuccess }: Props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const em = email.trim().toLowerCase();
		if (!em || !password) {
			toast.error('Enter email and password.');
			return;
		}
		setSubmitting(true);
		try {
			await loginRequest(em, password);
			toast.success('Signed in', { description: 'You can open Tools & Resources now.' });
			onOpenChange(false);
			setPassword('');
			onSuccess?.();
		} catch (err) {
			toast.error('Sign in failed', {
				description: err instanceof Error ? err.message : 'Try again.',
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LogIn className="h-5 w-5 text-muted-foreground" aria-hidden />
						Sign in for Tools &amp; Resources
					</DialogTitle>
					<DialogDescription>
						These pages are for members. Sign in with your account email, or{' '}
						<Link href="/register" className="font-medium text-primary underline">
							register
						</Link>
						.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 pt-2">
					<div className="grid gap-2">
						<Label htmlFor="tools-login-email">Email</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="tools-login-email"
								type="email"
								autoComplete="email"
								className="pl-10"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="tools-login-password">Password</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="tools-login-password"
								type="password"
								autoComplete="current-password"
								className="pl-10"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</div>
					<Button type="submit" className="w-full" disabled={submitting}>
						{submitting ? 'Signing in…' : 'Sign in'}
					</Button>
					<p className="text-center text-sm text-muted-foreground">
						<Link
							href="/forgot-password"
							className="underline underline-offset-4 hover:text-foreground"
							onClick={() => onOpenChange(false)}
						>
							Forgot password?
						</Link>
					</p>
				</form>
			</DialogContent>
		</Dialog>
	);
}
