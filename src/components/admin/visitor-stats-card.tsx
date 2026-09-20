import { Users, Eye, CalendarDays, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VisitorStats } from "@/lib/admin/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface VisitorStatsCardProps {
  stats: VisitorStats;
  dict: Dictionary["admin"];
  locale: Locale;
}

/**
 * "Visitor Statistics" dashboard widget: total / today / week / month unique
 * visitors plus a simple 7-day bar chart of page views.
 *
 * Pure presentational — all data arrives pre-fetched from the admin page
 * server component. The 7-day chart is built from CSS height bars (no chart
 * library, no client JS) so it stays lightweight and free-tier friendly.
 */
export function VisitorStatsCard({ stats, dict, locale }: VisitorStatsCardProps) {
  const t = dict.dashboard;
  const hasData =
    stats.totalVisitors > 0 || stats.totalViews > 0 || stats.todayVisitors > 0;

  const tiles = [
    { label: t.totalVisitors, value: stats.totalVisitors, icon: Users, tone: "text-accent" },
    { label: t.todayVisitors, value: stats.todayVisitors, icon: Clock, tone: "text-emerald-500" },
    { label: t.weekVisitors, value: stats.weekVisitors, icon: CalendarDays, tone: "text-sky-500" },
    { label: t.monthVisitors, value: stats.monthVisitors, icon: Eye, tone: "text-amber-500" },
  ];

  const maxDaily = Math.max(1, ...stats.dailyViews.map((d) => d.views));

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-accent" />
          {t.visitors}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Visitor count tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="rounded-xl border border-border/60 bg-secondary/30 p-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className={cn("h-3.5 w-3.5", tile.tone)} />
                  {tile.label}
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-foreground" dir="ltr">
                  {tile.value.toLocaleString(locale === "ar" ? "ar-KW" : "en-US")}
                </p>
              </div>
            );
          })}
        </div>

        {/* 7-day page-view bar chart */}
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">{t.dailyViews7d}</p>

          {hasData ? (
            <div className="mt-2 flex items-end gap-1.5" role="img" aria-label={t.dailyViews7d}>
              {stats.dailyViews.map((d) => {
                const pct = Math.round((d.views / maxDaily) * 100);
                const label = formatShortDay(d.date, locale);
                return (
                  <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                    <div className="relative flex h-24 w-full items-end">
                      <div
                        className="w-full rounded-t bg-accent/80 transition-colors group-hover:bg-accent"
                        style={{ height: `${Math.max(pct, d.views > 0 ? 8 : 2)}%` }}
                        title={`${label}: ${d.views}`}
                      />
                      {d.views > 0 && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100" dir="ltr">
                          {d.views}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t.noVisitorData}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Short day label ("Mon", "Sat") localized; date is "YYYY-MM-DD". */
function formatShortDay(dateKey: string, locale: Locale): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-US", {
    weekday: "short",
  });
  return fmt.format(date);
}
