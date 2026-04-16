"use client";

import { useId, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
};

export function PasswordField({ label, value, onChange, autoComplete, minLength, required = true }: Props) {
  const [visible, setVisible] = useState(false);
  const baseId = useId();
  const inputId = `${baseId}-pwd`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-11 rounded-lg border border-secondary/35 bg-page py-2 pl-3 pr-11 text-base outline-none ring-primary/30 focus:ring-2 sm:min-h-0 sm:text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink/55 hover:bg-secondary/15 hover:text-ink"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395m6.228 1.086A10.959 10.959 0 0 1 12 21c-4.638 0-8.573-3.007-9.963-7.178-.07-.207-.07-.431 0-.639C3.423 7.51 7.36 4.5 12 4.5c1.12 0 2.191.205 3.169.582m-6.228-1.086A10.959 10.959 0 0 1 12 3c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639a11.97 11.97 0 0 1-2.095 3.502M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  );
}
