import { Separator } from "@/components/ui/separator";
import { ThemeModePicker } from "@/components/theme-mode-picker";

export default function SettingsAppearancePage() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Appearance</h3>
				<p className="text-sm text-muted-foreground">
					Color mode is shared across the marketing site and dashboard.
				</p>
			</div>
			<Separator />
			<div className="space-y-3">
				<p className="text-sm font-medium text-foreground">Color theme</p>
				<ThemeModePicker />
			</div>
			<p className="text-xs text-muted-foreground">
				More layout options live under Settings → Display.
			</p>
		</div>
	);
}
