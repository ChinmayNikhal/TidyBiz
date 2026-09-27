import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Task } from '../../types/api';

interface CalendarWidgetProps {
  tasks: Task[];
  onSelectDate?: (date: Date) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ tasks, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Compute days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
  // Convert to Monday = 0
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from({ length: startOffset }, (_, i) => daysInPrevMonth - startOffset + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const remainingSlots = 42 - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: remainingSlots }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Check which days have tasks
  const taskDays = new Set(
    tasks.map((t) => {
      const d = new Date(t.due_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        return d.getDate();
      }
      return null;
    }).filter(Boolean)
  );

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header matching Ref 4 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#222321]">{monthName}</h3>
        <div className="flex items-center gap-1 text-[#73756F]">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-[#F5F5F1] hover:text-[#222321] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-[#F5F5F1] hover:text-[#222321] transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers matching Ref 4: Mo, Tu, We, Th, Fr, Sa, Su */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#73756F] mb-2">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Previous Month Days */}
        {prevMonthDays.map((d) => (
          <span key={`prev-${d}`} className="py-1 text-[#73756F]/40 select-none">
            {d}
          </span>
        ))}

        {/* Current Month Days */}
        {currentMonthDays.map((day) => {
          const isToday = isCurrentMonth && today.getDate() === day;
          const isSelected = selectedDay === day;
          const hasTask = taskDays.has(day);

          return (
            <button
              key={`day-${day}`}
              onClick={() => {
                setSelectedDay(day);
                if (onSelectDate) onSelectDate(new Date(year, month, day));
              }}
              className="relative py-1 flex items-center justify-center group focus:outline-none"
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center font-medium transition-all text-xs',
                  isToday
                    ? 'bg-[#E8EB39] text-[#222321] font-bold shadow-2xs'
                    : isSelected
                    ? 'bg-[#222321] text-white'
                    : 'text-[#222321] hover:bg-[#F5F5F1]'
                )}
              >
                {day}
              </span>
              {hasTask && !isToday && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-[#222321] rounded-full" />
              )}
            </button>
          );
        })}

        {/* Next Month Days */}
        {nextMonthDays.slice(0, 7).map((d) => (
          <span key={`next-${d}`} className="py-1 text-[#73756F]/40 select-none">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};
