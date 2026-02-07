"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  isBefore,
  getYear,
  setYear,
  eachDayOfInterval,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(
    () => value.from ?? new Date()
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const currentYearRef = useRef<HTMLButtonElement>(null);

  const selectedYear = getYear(currentMonth);
  const today = new Date();

  // Year list: 2020 ~ current year + 5
  const years = useMemo(() => {
    const startYear = 2020;
    const endYear = getYear(today) + 5;
    const list: number[] = [];
    for (let y = startYear; y <= endYear; y++) list.push(y);
    return list;
  }, []);

  // Scroll the selected year into view on mount
  useEffect(() => {
    if (currentYearRef.current) {
      currentYearRef.current.scrollIntoView({ block: "center" });
    }
  }, []);

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    if (!value.from || (value.from && value.to)) {
      // First click or resetting
      onChange({ from: day, to: null });
    } else {
      // Second click - set range
      if (isBefore(day, value.from)) {
        onChange({ from: day, to: value.from });
      } else {
        onChange({ from: value.from, to: day });
      }
    }
  };

  const handleYearClick = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year));
  };

  // Determine if a day is in the selected or hovered range
  const getDayState = (day: Date) => {
    const { from, to } = value;
    const isStart = from && isSameDay(day, from);
    const isEnd = to && isSameDay(day, to);
    const inCurrentMonth = isSameMonth(day, currentMonth);

    let inRange = false;
    let inPreview = false;

    if (from && to) {
      inRange = isWithinInterval(day, { start: from, end: to });
    } else if (from && !to && hoverDate) {
      const previewStart = isBefore(hoverDate, from) ? hoverDate : from;
      const previewEnd = isBefore(hoverDate, from) ? from : hoverDate;
      inPreview = isWithinInterval(day, {
        start: previewStart,
        end: previewEnd,
      });
    }

    return { isStart, isEnd, inRange, inPreview, inCurrentMonth };
  };

  // Format selected range text
  const rangeText = useMemo(() => {
    const { from, to } = value;
    if (!from && !to) return "날짜를 선택해주세요";
    if (from && !to) return `${format(from, "yyyy.MM.dd")} ~ 종료일 선택`;
    if (from && to)
      return `${format(from, "yyyy.MM.dd")} ~ ${format(to, "yyyy.MM.dd")}`;
    return "";
  }, [value]);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden",
        className
      )}
    >
      <div className="flex">
        {/* Left Panel: Year selector */}
        <div className="w-[72px] border-r bg-muted/40">
          <ScrollArea className="h-[296px]">
            <div className="py-1">
              {years.map((year) => {
                const isSelected = year === selectedYear;
                const isCurrent = year === getYear(today);
                return (
                  <button
                    key={year}
                    ref={isSelected ? currentYearRef : undefined}
                    type="button"
                    onClick={() => handleYearClick(year)}
                    className={cn(
                      "w-full px-2 py-1.5 text-xs text-center transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isCurrent
                          ? "text-primary font-medium hover:bg-accent"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Calendar grid */}
        <div className="flex-1 p-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">
              {format(currentMonth, "yyyy년 M월", { locale: ko })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "h-7 flex items-center justify-center text-[11px] font-medium",
                  i === 0
                    ? "text-red-400"
                    : i === 6
                      ? "text-blue-400"
                      : "text-muted-foreground"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const { isStart, isEnd, inRange, inPreview, inCurrentMonth } =
                getDayState(day);
              const dayIsToday = isToday(day);
              const dayOfWeek = day.getDay();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={cn(
                    "h-8 w-full relative flex items-center justify-center text-xs transition-colors",
                    // Base text color
                    !inCurrentMonth && "text-muted-foreground/40",
                    inCurrentMonth && dayOfWeek === 0 && "text-red-500",
                    inCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                    // Range background
                    (inRange || inPreview) &&
                      !isStart &&
                      !isEnd &&
                      "bg-accent",
                    // Preview (hover) styling
                    inPreview && !isStart && !isEnd && "bg-accent/60",
                    // Start & End: primary pill
                    (isStart || isEnd) &&
                      "bg-primary text-primary-foreground font-semibold rounded-md z-10",
                    // Range connectors (no rounding on inner edges)
                    inRange && isStart && value.to && !isSameDay(value.from!, value.to!) && "rounded-r-none",
                    inRange && isEnd && value.from && !isSameDay(value.from!, value.to!) && "rounded-l-none",
                    // Hover when not selected
                    !isStart &&
                      !isEnd &&
                      inCurrentMonth &&
                      "hover:bg-accent/80 rounded-md"
                  )}
                >
                  {format(day, "d")}
                  {/* Today dot indicator */}
                  {dayIsToday && !isStart && !isEnd && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Selected range display */}
      <div className="border-t px-3 py-2 bg-muted/30">
        <p className="text-xs text-center text-muted-foreground">{rangeText}</p>
      </div>
    </div>
  );
}
