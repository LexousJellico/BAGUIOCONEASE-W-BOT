import { useEffect, useMemo, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/themes/material_blue.css';

export type DateTimePickerProps = {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string | Date;
  maxDate?: string | Date;
  className?: string;
  hideOriginal?: boolean;
  disableDates?: string[];
  placement?: 'above' | 'below';
  persistentOpen?: boolean; // keep calendar open (inline) until user clicks outside
  keepOpen?: boolean; // keep popup calendar open until outside click (non-inline mode)
};

const FP_FORMAT = 'Y-m-d H:i'; // internal flatpickr format (no seconds)

function formatLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  // Emit space separator to align with typical SQL datetime format
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function DateTimePicker({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  minDate,
  maxDate,
  className,
  hideOriginal = true,
  disableDates,
  placement = 'below',
  persistentOpen = false,
}: DateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  const parsedDate = useMemo(() => {
    if (!value) return undefined;
    // Support both 'T' and space separator, optional seconds, optional timezone part.
    const re = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/;
    const m = value.match(re);
    if (m) {
      const [, y, mo, da, h, mi, s] = m;
      // Intentionally ignore timezone offset to keep literal stored hour
      const d = new Date(Number(y), Number(mo) - 1, Number(da), Number(h), Number(mi), s ? Number(s) : 0, 0);
      return isNaN(d.getTime()) ? undefined : d;
    }
    // Fallback to native parse
    const fb = new Date(value);
    return isNaN(fb.getTime()) ? undefined : fb;
  }, [value]);

  const disableDatesSet = useMemo(() => new Set(disableDates ?? []), [disableDates]);

  useEffect(() => {
    if (!inputRef.current) return;
    fpRef.current = flatpickr(inputRef.current, {
      enableTime: true,
      time_24hr: false,
      dateFormat: FP_FORMAT,
      altInput: true,
      altFormat: 'M j, Y h:i K',
      altInputClass: className || 'w-full border bg-background rounded-md px-3 py-2 text-sm',
      minuteIncrement: 5,
      allowInput: true,
      static: true,
      closeOnSelect: false,
      ignoredFocusElements: [],
      defaultDate: parsedDate,
      minDate,
      maxDate,
      appendTo: wrapperRef.current || undefined,
      inline: persistentOpen, // render inline if persistent
      disable: [
        (date) => {
          if (!disableDatesSet.size) return false;
          const pad = (n: number) => String(n).padStart(2, '0');
          const y = date.getFullYear();
          const m = pad(date.getMonth() + 1);
          const d = pad(date.getDate());
          const key = `${y}-${m}-${d}`;
          return disableDatesSet.has(key);
        },
      ],
      // Emit local naive string without timezone (prevents unwanted UTC shift)
      onValueUpdate: (selectedDates) => {
        const first = selectedDates?.[0];
        if (!first) { onChange?.(''); return; }
        onChange?.(formatLocal(first));
      },
      onReady: (_sel, _str, instance) => {
        if (hideOriginal && id && instance.altInput) {
          instance.altInput.id = id;
          inputRef.current?.removeAttribute('id');
        }
        // Ensure browser autocomplete is disabled on both inputs
        if (instance.altInput) {
          instance.altInput.setAttribute('autocomplete', 'off');
          instance.altInput.setAttribute('aria-autocomplete', 'none');
        }

        // Fix the internal flatpickr wrapper width (this is what was limiting you)
        const fpWrapper = instance.altInput?.closest('.flatpickr-wrapper') as HTMLElement | null;
        if (fpWrapper) {
          fpWrapper.classList.add('w-full');
        }

        instance.input.setAttribute('autocomplete', 'off');
        instance.input.setAttribute('aria-autocomplete', 'none');
        if (!persistentOpen) {
          // Initial positioning (height may be zero before open)
          positionCalendar(instance);
        } else {
          styleInlineCalendar(instance);
        }

        // Prevent modal from closing when clicking inside flatpickr
        // Only stop propagation on pointerdown which Radix UI uses for outside click detection
        const cal = instance.calendarContainer;
        if (cal) {
          cal.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
          }, { capture: false }); // Use bubble phase, not capture
        }

        // Prevent time inputs from closing the calendar
        const timeInputs = cal?.querySelectorAll('.flatpickr-time input, .numInput');
        timeInputs?.forEach((input) => {
          input.addEventListener('focus', (e) => {
            e.stopPropagation();
          });
          input.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
          });

          // Force flatpickr to update when time inputs change
          input.addEventListener('input', () => {
            // Trigger flatpickr's internal time sync
            const hourInput = cal?.querySelector('.flatpickr-hour') as HTMLInputElement;
            const minuteInput = cal?.querySelector('.flatpickr-minute') as HTMLInputElement;
            const ampmInput = cal?.querySelector('.flatpickr-am-pm') as HTMLInputElement;

            if (hourInput && minuteInput && instance.selectedDates.length > 0) {
              let hours = parseInt(hourInput.value, 10);
              const minutes = parseInt(minuteInput.value, 10);

              if (isNaN(hours) || isNaN(minutes)) {
                return;
              }

              // Handle AM/PM
              if (ampmInput && ampmInput.textContent) {
                const period = ampmInput.textContent.toUpperCase();
                if (period === 'PM' && hours !== 12) {
                  hours += 12;
                } else if (period === 'AM' && hours === 12) {
                  hours = 0;
                }
              }

              // Update the selected date
              const baseDate = instance.selectedDates[0];
              const newDate = new Date(
                baseDate.getFullYear(),
                baseDate.getMonth(),
                baseDate.getDate(),
                hours,
                minutes,
                0,
                0
              );

              // Update without triggering events to avoid loops
              // instance.selectedDates[0] = newDate;
              instance.setDate(newDate, true);
            }
          });
        });
      },
      onOpen: (_sel, _str, instance) => {
        if (!persistentOpen) {
          // Re-run after calendar renders/open for accurate height
          requestAnimationFrame(() => positionCalendar(instance));
        }
      },
      onChange: (selectedDates) => {
        const first = selectedDates?.[0];
        if (!first) { onChange?.(''); return; }
        onChange?.(formatLocal(first));
      },
      onClose: (selectedDates) => {
        if (selectedDates.length > 0) {
          onChange?.(formatLocal(selectedDates[0]));
        }
      },
    });

    const repositionCalendar = () => {
      if (!persistentOpen && fpRef.current) {
        positionCalendar(fpRef.current);
      }
    };

    window.addEventListener('resize', repositionCalendar);
    window.visualViewport?.addEventListener('resize', repositionCalendar);

    return () => {
      window.removeEventListener('resize', repositionCalendar);
      window.visualViewport?.removeEventListener('resize', repositionCalendar);
      fpRef.current?.destroy();
      fpRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // With keepOpen, flatpickr remains open until natural outside click closes it

  function positionCalendar(instance: flatpickr.Instance) {
    const cal = instance.calendarContainer;
    const alt = instance.altInput as HTMLElement | undefined;
    if (!cal || !alt) return;
    // Ensure calendar is inside wrapper for relative positioning
    if (wrapperRef.current && !wrapperRef.current.contains(cal)) {
      wrapperRef.current.appendChild(cal);
    }

    const viewportWidth = window.innerWidth;
    const calendarWidth = Math.max(272, Math.min(320, viewportWidth - 16));

    cal.style.zIndex = '5000';
    cal.style.position = 'absolute';
    cal.style.width = `${calendarWidth}px`;
    cal.style.maxWidth = 'calc(100vw - 1rem)';
    cal.style.right = 'auto';
    cal.style.overflowY = 'auto';
    cal.style.maxHeight = 'min(70vh, 420px)';
    cal.style.boxShadow = '0 8px 16px -4px rgba(0,0,0,0.25), 0 4px 6px -2px rgba(0,0,0,0.15)';
    cal.style.borderRadius = '8px';

    const inputH = (alt.offsetHeight || 40) + 4;
    const calHeight = cal.offsetHeight || 350;

    // Get viewport dimensions and input position
    const rect = alt.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const overflowRight = Math.max(0, rect.left + calendarWidth - viewportWidth + 8);
    const overflowLeft = Math.max(0, 8 - rect.left);
    const leftOffset = overflowLeft || (overflowRight ? -overflowRight : 0);

    cal.style.left = `${leftOffset}px`;

    // Auto-determine placement based on available space
    let finalPlacement = placement;
    if (placement === 'below' && spaceBelow < calHeight && spaceAbove > spaceBelow) {
      // Not enough space below and more space above - flip to above
      finalPlacement = 'above';
    } else if (placement === 'above' && spaceAbove < calHeight && spaceBelow > spaceAbove) {
      // Not enough space above and more space below - flip to below
      finalPlacement = 'below';
    }

    if (finalPlacement === 'below') {
      cal.style.top = inputH + 'px';
      cal.style.bottom = 'auto';
      cal.style.transform = 'none';
    } else {
      // Position above
      cal.style.top = -(calHeight + 4) + 'px';
      cal.style.bottom = 'auto';
      cal.style.transform = 'none';
    }
  }

  function styleInlineCalendar(instance: flatpickr.Instance) {
    const cal = instance.calendarContainer;
    if (!cal) return;
    // For inline mode, we still want custom styling but no repositioning logic.
    cal.style.position = 'static';
    cal.style.marginTop = placement === 'below' ? '0.5rem' : '0';
    if (placement === 'above') {
      // Move calendar before the alt input for above placement in inline mode
      if (wrapperRef.current && instance.altInput && cal.nextSibling === instance.altInput) {
        wrapperRef.current.insertBefore(cal, instance.altInput);
      }
      cal.style.marginBottom = '0.5rem';
    }
  }

  // reactive constraints
  useEffect(() => { fpRef.current?.set('minDate', minDate); }, [minDate]);
  useEffect(() => { fpRef.current?.set('maxDate', maxDate); }, [maxDate]);
  useEffect(() => {
    if (!fpRef.current) return;
    if (!disableDatesSet.size) { fpRef.current.set('disable', []); return; }
    fpRef.current.set('disable', [ (date: Date) => {
      const pad = (n: number) => String(n).padStart(2,'0');
      const key = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
      return disableDatesSet.has(key);
    } ]);
  }, [disableDatesSet]);
  useEffect(() => {
    if (!fpRef.current) return;
    const current = fpRef.current.input.value;
    if (parsedDate) {
      const pad = (n: number) => String(n).padStart(2,'0');
      const next = `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth()+1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
      if (current !== next) fpRef.current.setDate(parsedDate, false, FP_FORMAT);
    } else if (current !== '') fpRef.current.clear();
  }, [parsedDate]);

  return (
    <div ref={wrapperRef} className={persistentOpen ? 'relative overflow-visible flex flex-col' : 'relative overflow-visible'}>
      <input
        id={hideOriginal ? undefined : id}
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="none"
        // className={hideOriginal ? 'hidden' : className}
        className={hideOriginal ? 'hidden' : (className ? `w-full ${className}` : 'w-full')}
        onChange={() => { /* managed by flatpickr */ }}
      />
    </div>
  );
}
