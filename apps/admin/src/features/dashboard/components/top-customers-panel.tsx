import { Badge } from "@itech/shared";
import { currency } from "../helpers";
import type { TopMember } from "../types";

type TopCustomersPanelProps = {
  topMembers: TopMember[];
};

export default function TopCustomersPanel({ topMembers }: TopCustomersPanelProps) {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <div>
        <p className="text-sm font-semibold text-[#008ECC]">Top customers</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950">Highest lifetime spend</h3>
      </div>

      <div className="mt-6 space-y-4">
        {topMembers.length > 0 ? (
          topMembers.map((member) => (
            <article
              key={member.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                      {member.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">
                        {member.Customer?.User?.username || "Unknown user"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {member.Customer?.User?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge tone="success">{member.membership}</Badge>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">Lifetime spend</span>
                <span className="text-lg font-semibold text-slate-950">
                  {currency.format(Number(member.spent ?? 0))}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No membership data available.
          </div>
        )}
      </div>
    </article>
  );
}
