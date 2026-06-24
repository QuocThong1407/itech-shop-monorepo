import { Button, FormField, SelectInput, TextInput } from "@itech/shared";
import type { RevenueGroupBy } from "../types";

type RevenueFilterFormProps = {
  rangeStart: string;
  rangeEnd: string;
  groupBy: RevenueGroupBy;
  exportHref: string;
};

export default function RevenueFilterForm({
  rangeStart,
  rangeEnd,
  groupBy,
  exportHref,
}: RevenueFilterFormProps) {
  return (
    <form
      method="get"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr_auto_auto]"
    >
      <FormField
        label="Start date"
        labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
      >
        <TextInput
          type="date"
          name="startDate"
          defaultValue={rangeStart}
          className="!bg-white"
        />
      </FormField>
      <FormField
        label="End date"
        labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
      >
        <TextInput
          type="date"
          name="endDate"
          defaultValue={rangeEnd}
          className="!bg-white"
        />
      </FormField>
      <FormField
        label="Group by"
        className="sm:col-span-2 xl:col-span-1"
        labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
      >
        <SelectInput
          name="groupBy"
          defaultValue={groupBy}
          className="!bg-white"
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </SelectInput>
      </FormField>
      <div className="sm:col-span-2 xl:col-span-1 xl:self-end">
        <Button
          type="submit"
          variant="primary"
          className="!w-full !border !border-slate-900 !shadow-none xl:!w-auto"
        >
          Apply filters
        </Button>
      </div>
      <div className="sm:col-span-2 xl:col-span-1 xl:self-end">
        <a
          href={exportHref}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 xl:w-auto"
        >
          Export Excel
        </a>
      </div>
    </form>
  );
}
