"use client";

import { FormField, TextInput } from "@itech/shared";

type LabeledInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
};

export function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: LabeledInputProps) {
  return (
    <FormField
      label={label}
      labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
    >
      <TextInput
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="text-slate-900"
      />
    </FormField>
  );
}

type LabeledNumberProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function LabeledNumber({
  label,
  value,
  onChange,
  placeholder,
}: LabeledNumberProps) {
  return (
    <FormField
      label={label}
      labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
      className="!flex !flex-col gap-1.5"
    >
      <TextInput
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="text-slate-900 h-fit"
      />
    </FormField>
  );
}

type ToggleFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-[#008ECC]" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
