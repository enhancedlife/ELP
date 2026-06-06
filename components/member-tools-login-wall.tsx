'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LogIn, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginRequest } from '@/lib/auth';

type Props = {
	/** Current path (for display only; after login the page re-renders with content). */
	redirectPath: string;
};

export function MemberToolsLoginWall({ redirectPath }: Props) {
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
			toast.success('Signed in');
		} catch (err) {
			toast.error('Sign in failed', {
				description: err instanceof Error ? err.message : 'Try again.',
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md shadow-md">
				<CardHeader className="text-center">
					<LogIn className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
					<CardTitle className="mt-3 text-xl">Member sign-in required</CardTitle>
					<CardDescription>
						Tools &amp; Resources ({redirectPath}) are available after you sign in with your member
						account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="wall-email">Email</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="wall-email"
									type="email"
									autoComplete="email"
									className="pl-10"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="wall-password">Password</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="wall-password"
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
					</form>
				</CardContent>
				<CardFooter className="flex flex-col gap-3 border-t pt-6 text-center text-sm">
					<Link href="/forgot-password" className="text-primary underline underline-offset-4">
						Forgot password?
					</Link>
					<p className="text-muted-foreground">
						New here?{' '}
						<Link href="/register" className="font-medium text-primary underline underline-offset-4">
							Create an account
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
