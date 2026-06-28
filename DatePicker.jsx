import { useState, useRef, useEffect } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 11L6 8l4-3" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 5l4 3-4 3" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ color = "#161616" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M26,4H22V2H20V4H12V2H10V4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V6A2,2,0,0,0,26,4ZM26,26H6V12H26ZM26,10H6V6h4V8h2V6h8V8h2V6h4Z" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function buildCalendarGrid(year, month) {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const cells = [];

  // Days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const d = new Date(year, month - 1, day);
    cells.push({ date: d, current: false });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }

  // Days from next month to fill remaining cells (always 6 rows = 42 cells)
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay++), current: false });
  }

  // Chunk into weeks
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function formatDate(date) {
  if (!date) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function parseDate(str) {
  if (!str || str.length !== 10) return null;
  const [mm, dd, yyyy] = str.split("/").map(Number);
  if (!mm || !dd || !yyyy || yyyy < 1000) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (isNaN(d.getTime())) return null;
  return d;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(date) {
  return isSameDay(date, new Date());
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&family=IBM+Plex+Sans:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .cdp-root {
    font-family: 'IBM Plex Sans', sans-serif;
    position: relative;
    width: 288px;
    color: #161616;
  }

  /* ── Label ── */
  .cdp-label {
    display: block;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0.32px;
    color: #525252;
    margin-bottom: 8px;
  }

  /* ── Input ── */
  .cdp-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 48px;
    padding: 0 16px;
    background: #f4f4f4;
    border: none;
    border-bottom: 1px solid #8d8d8d;
    outline: 2px solid transparent;
    outline-offset: -2px;
    transition: outline-color 0.1s;
    cursor: text;
  }

  .cdp-input-wrapper:focus-within {
    outline-color: #0f62fe;
  }

  .cdp-input-wrapper.open {
    outline-color: #0f62fe;
  }

  .cdp-text-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.32px;
    color: #161616;
    outline: none;
    min-width: 0;
  }

  .cdp-text-input::placeholder {
    color: #a8a8a8;
  }

  .cdp-calendar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #161616;
    flex-shrink: 0;
  }

  .cdp-calendar-btn:focus-visible {
    outline: 2px solid #0f62fe;
    outline-offset: 2px;
  }

  /* ── Calendar panel ── */
  .cdp-panel {
    position: absolute;
    top: calc(100%);
    left: 0;
    z-index: 9999;
    background: #f4f4f4;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.30);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 288px;
    animation: cdp-fade-in 0.1s ease;
  }

  @keyframes cdp-fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Month / year header ── */
  .cdp-month-year {
    display: flex;
    align-items: center;
    height: 40px;
  }

  .cdp-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.1s;
  }

  .cdp-nav-btn:hover { background: #e8e8e8; }
  .cdp-nav-btn:focus-visible { outline: 2px solid #0f62fe; outline-offset: -2px; }

  .cdp-month-label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    letter-spacing: 0.16px;
    color: #161616;
    user-select: none;
  }

  /* ── Day grid ── */
  .cdp-grid {
    display: grid;
    grid-template-columns: repeat(7, 40px);
  }

  .cdp-day-header {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.16px;
    color: #161616;
    user-select: none;
  }

  .cdp-day {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.16px;
    cursor: pointer;
    user-select: none;
    border: none;
    background: none;
    padding: 0;
    transition: background 0.1s;
    color: #161616;
  }

  .cdp-day.outside {
    color: #525252;
  }

  .cdp-day:hover:not(.selected):not(:disabled) {
    background: #e8e8e8;
  }

  .cdp-day:focus-visible {
    outline: 2px solid #0f62fe;
    outline-offset: -2px;
    z-index: 1;
  }

  .cdp-day.today:not(.selected) {
    font-weight: 600;
  }

  .cdp-day.today:not(.selected)::after {
    content: '';
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #161616;
  }

  .cdp-day.selected {
    color: #0f62fe;
    font-weight: 600;
    background: transparent;
  }

  .cdp-day.selected .cdp-selected-dot {
    display: block;
  }

  .cdp-selected-dot {
    display: none;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #0f62fe;
    margin-top: 1px;
    flex-shrink: 0;
  }

  /* ── Divider between header and days ── */
  .cdp-divider {
    height: 1px;
    background: #e0e0e0;
    margin: 0 4px;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DatePicker({
  label = "Label",
  placeholder = "mm/dd/yyyy",
  defaultValue = null,
  onChange,
  id = "date-picker",
}) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(defaultValue);
  const [inputValue, setInputValue] = useState(defaultValue ? formatDate(defaultValue) : "");
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState((defaultValue ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((defaultValue ?? today).getMonth());

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function selectDate(date) {
    setSelectedDate(date);
    setInputValue(formatDate(date));
    setIsOpen(false);
    inputRef.current?.focus();
    onChange?.(date);
  }

  function handleInputChange(e) {
    const raw = e.target.value;

    // Auto-insert slashes as user types
    let val = raw.replace(/[^\d]/g, "");
    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5);
    val = val.slice(0, 10);

    setInputValue(val);

    const parsed = parseDate(val);
    if (parsed) {
      setSelectedDate(parsed);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      onChange?.(parsed);
    } else if (val === "") {
      setSelectedDate(null);
      onChange?.(null);
    }
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const weeks = buildCalendarGrid(viewYear, viewMonth);

  return (
    <>
      <style>{styles}</style>
      <div className="cdp-root" ref={rootRef}>
        {/* Label */}
        <label className="cdp-label" htmlFor={id}>{label}</label>

        {/* Input */}
        <div className={`cdp-input-wrapper${isOpen ? " open" : ""}`}>
          <input
            ref={inputRef}
            id={id}
            className="cdp-text-input"
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            autoComplete="off"
            aria-haspopup="true"
            aria-expanded={isOpen}
          />
          <button
            className="cdp-calendar-btn"
            aria-label="Open calendar"
            tabIndex={-1}
            onClick={() => {
              setIsOpen(o => !o);
              if (!isOpen) inputRef.current?.focus();
            }}
          >
            <CalendarIcon color={isOpen ? "#0f62fe" : "#161616"} />
          </button>
        </div>

        {/* Calendar panel */}
        {isOpen && (
          <div className="cdp-panel" ref={panelRef} role="dialog" aria-label="Calendar">
            {/* Month / Year navigation */}
            <div className="cdp-month-year">
              <button
                className="cdp-nav-btn"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <ChevronLeftIcon />
              </button>

              <div className="cdp-month-label">
                <span>{MONTHS[viewMonth]}</span>
                <span>{viewYear}</span>
              </div>

              <button
                className="cdp-nav-btn"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="cdp-grid">
              {DAYS.map((d, i) => (
                <div key={i} className="cdp-day-header" aria-hidden="true">{d}</div>
              ))}
            </div>

            <div className="cdp-divider" />

            {/* Date grid */}
            <div className="cdp-grid" role="grid" aria-label={`${MONTHS[viewMonth]} ${viewYear}`}>
              {weeks.map((week, wi) =>
                week.map((cell, di) => {
                  const isSelected = isSameDay(cell.date, selectedDate);
                  const isTodayCell = isToday(cell.date);
                  const classes = [
                    "cdp-day",
                    !cell.current ? "outside" : "",
                    isSelected ? "selected" : "",
                    isTodayCell && !isSelected ? "today" : "",
                  ].filter(Boolean).join(" ");

                  return (
                    <button
                      key={`${wi}-${di}`}
                      className={classes}
                      onClick={() => selectDate(cell.date)}
                      aria-label={cell.date.toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                      aria-pressed={isSelected}
                      aria-current={isTodayCell ? "date" : undefined}
                      role="gridcell"
                    >
                      {cell.date.getDate()}
                      <span className="cdp-selected-dot" aria-hidden="true" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
