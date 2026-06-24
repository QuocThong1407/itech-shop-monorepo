import { Badge, PageIntro } from "@itech/shared";

export default function DashboardHero() {
  return (
    <PageIntro
      eyebrow="Admin dashboard"
      title="Real-time control over sales, inventory, and customer health."
      description="This dashboard now reads from the backend directly, so the cards, orders, top customers, and revenue trend reflect actual project data instead of placeholders."
      className="shadow-[0_24px_80px_rgba(15,23,42,0.06)]"
      contentClassName="space-y-4"
      titleClassName="mt-0"
      descriptionClassName="text-base leading-7"
      actions={
        <span className="text-sm text-slate-500">
          <Badge tone="neutral" className="bg-sky-50 text-[#008ECC] ring-sky-200">
            Live
          </Badge>
          <span className="ml-3">
            Live data from users, orders, revenue, and membership services
          </span>
        </span>
      }
    />
  );
}
