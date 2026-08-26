import { useState } from "react";

export const fieldClass =
  "w-full border rounded-lg px-3 py-2 pr-9 dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

// ponytail: native <datalist> hi kaafi hota, lekin Chromium uska koi arrow nahi banata
// aur uska popup DOM mein nahi hota — yaani test kabhi nahi hota. 30 line ka apna
// listbox: click par poori list, type par filter, aur browser se poora control.
// options: [{ key, label, hint }]
export default function Combo({ id, label, value, onChange, options, placeholder, className = fieldClass }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const needle = value.trim().toLowerCase();
  const shown = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  const pick = (o) => {
    onChange(o.label);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (shown.length ? (e.key === "ArrowDown" ? i + 1 : i - 1 + shown.length) % shown.length : 0));
    } else if (e.key === "Enter" && open && shown[active]) {
      e.preventDefault();
      pick(shown[active]);
    }
  };

  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium mb-2">{label}</label>}
      <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          // Escape ke baad input focused hi rehta hai — sirf onFocus se dobara nahi khulti.
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={className}
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[var(--text-secondary)]">▾</span>
        {open && (
          // onMouseDown preventDefault — warna blur pehle chalta hai aur click gum ho jata hai.
          <ul
            id={`${id}-list`}
            role="listbox"
            onMouseDown={(e) => e.preventDefault()}
            className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]"
          >
            {shown.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No match</li>
            ) : (
              shown.map((o, i) => (
                <li
                  key={o.key}
                  role="option"
                  aria-selected={o.label === value}
                  onClick={() => pick(o)}
                  onMouseEnter={() => setActive(i)}
                  className={`px-3 py-2 text-sm cursor-pointer ${i === active ? "bg-indigo-50 dark:bg-white/10" : ""}`}
                >
                  <span className="block dark:text-[var(--text-primary)]">{o.label}</span>
                  {o.hint ? <span className="block text-xs text-gray-500">{o.hint}</span> : null}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
