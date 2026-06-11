import {
	Activity,
	CreditCard,
	Eye,
	FileText,
	LayoutList,
	Minus,
	TrendingDown,
	TrendingUp,
	UserPlus,
	Users,
	type LucideIcon,
} from "lucide-react";

const byKey: Record<string, LucideIcon> = {
	pages: FileText,
	sponsors: CreditCard,
	users: Users,
	users_week: UserPlus,
	users_month: UserPlus,
	visits: Eye,
	activity: Activity,
	draft: LayoutList,
};

export function dashboardIconForKey(iconKey: string): LucideIcon {
	return byKey[iconKey] ?? LayoutList;
}

export function trendIcon(trend: "up" | "down" | "neutral") {
	if (trend === "up") return TrendingUp;
	if (trend === "down") return TrendingDown;
	return Minus;
}
