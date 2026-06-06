import {
	Activity,
	CreditCard,
	FileText,
	LayoutList,
	Minus,
	TrendingDown,
	TrendingUp,
	Users,
	type LucideIcon,
} from "lucide-react";

const byKey: Record<string, LucideIcon> = {
	pages: FileText,
	sponsors: CreditCard,
	users: Users,
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
