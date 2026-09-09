import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function Select({
  name,
  options = [],
  value,
  defaultValue = '',
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Select…',
  className = '',
  size = 'md',
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ''));
  const selectedValue = isControlled ? String(value ?? '') : internalValue;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();

  const selectedOption = options.find((opt) => String(opt.value) === selectedValue);
  const displayLabel = selectedOption?.label || placeholder;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return undefined;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220 && rect.top > spaceBelow;
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        zIndex: 80,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target) && !e.target.closest(`[data-select-menu="${listId}"]`)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, listId]);

  useEffect(() => {
    if (!required) return undefined;
    const form = rootRef.current?.closest('form');
    if (!form) return undefined;

    const onSubmit = (e) => {
      if (!selectedValue) {
        e.preventDefault();
        setError(true);
        setOpen(true);
      }
    };

    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, [required, selectedValue]);

  const commit = (next) => {
    const nextValue = String(next);
    if (!isControlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setError(false);
    setOpen(false);
  };

  const sizeClass =
    size === 'sm'
      ? 'min-h-[2rem] px-2.5 py-1.5 text-xs'
      : 'min-h-[2.5rem] px-3 py-2 text-sm';

  const menu = open
    ? createPortal(
      <ul
        id={listId}
        data-select-menu={listId}
        role="listbox"
        style={menuStyle}
        className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10 animate-[modal-fade_120ms_ease-out]"
      >
        {options.map((opt) => {
          const optValue = String(opt.value);
          const isActive = optValue === selectedValue;
          return (
            <li key={`${optValue}-${opt.label}`}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => commit(optValue)}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-sky-50 font-medium text-sky-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body,
    )
    : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={error || undefined}
        aria-required={required || undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white text-left shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20'
            : open
              ? 'border-sky-400 ring-2 ring-sky-500/20'
              : 'border-slate-200 focus:border-sky-400 focus:ring-sky-500/20'
        }`}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {menu}
    </div>
  );
}

export default Select;
