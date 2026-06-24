import { Button, FormField, TextInput } from "@itech/shared";

type ActivityFilterFormProps = {
  rangeStart: string;
  rangeEnd: string;
  exportHref: string;
};

export default function ActivityFilterForm({
  rangeStart,
  rangeEnd,
  exportHref,
}: ActivityFilterFormProps) {
  return (
    <form
      method="get"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]"
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
