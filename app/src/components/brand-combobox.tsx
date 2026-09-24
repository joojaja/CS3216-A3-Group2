"use client";

import { useId, useRef, useState } from "react";
import { inputClass } from "@/components/measurement-step";
import { brandSuggestions } from "@/lib/sizing/charts";

// Brand field with a list of the brands we hold charts for. Replaces a
// native <datalist>, which filters on the current value and so showed
// nothing once a brand was picked. Free text is still allowed: a brand we
// have no chart for leads to the "screenshot the size chart" notice.
export function BrandCombobox({
  id,
  value,
  onChange,
  onCommit,
  onEnter,
  autoFocus,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  // Called when the user settles on a value: picking an option, Enter or blur
  onCommit?: (value: string) => void;
  // Enter with no option highlighted, after the value is committed
  onEnter?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const options = brandSuggestions(value);
  const showList = open && options.length > 0;

  function show() {
    setOpen(true);
    setActive(-1);
  }

  function pick(brand: string) {
    onChange(brand);
    onCommit?.(brand);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showList && active >= 0) {
        e.preventDefault();
        pick(options[active]);
      } else {
        setOpen(false);
        onCommit?.(value);
        onEnter?.();
      }
    } else if (e.key === "Escape" && showList) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          show();
        }}
        onFocus={show}
        onClick={show}
        onBlur={() => {
          setOpen(false);
          onCommit?.(value);
        }}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        maxLength={80}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Show brands"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          input.current?.focus();
          setOpen((o) => !o);
        }}
        className="absolute right-1 bottom-1 grid size-9 place-items-center rounded-md text-mute hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Brands with a stored size chart"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {options.map((brand, i) => (
            <li
              key={brand}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(brand)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-10 cursor-pointer items-center px-3 text-sm font-normal ${
                i === active ? "bg-cobalt-light text-cobalt-deep" : "text-body"
              }`}
            >
              {brand}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
