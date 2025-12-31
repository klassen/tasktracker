'use client';

interface MiniCalendarProps {
  year: number;
  month: number;
  completionDates: string[]; // Array of YYYY-MM-DD strings
  taskTitle: string;
  onClose: () => void;
}

export default function MiniCalendar({ year, month, completionDates, taskTitle, onClose }: MiniCalendarProps) {
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  };

  const getMonthName = () => {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create array of day numbers with leading empty cells
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isCompletedDate = (day: number) => {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completionDates.includes(dateString);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {taskTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {getMonthName()}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => (
            <div
              key={index}
              className={`
                aspect-square flex items-center justify-center text-sm rounded
                ${day === null ? '' : 'text-gray-900 dark:text-white'}
                ${day !== null && isCompletedDate(day) 
                  ? 'bg-green-500 text-white font-bold' 
                  : day !== null 
                  ? 'bg-gray-100 dark:bg-gray-700' 
                  : ''
                }
              `}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          <span className="inline-block w-4 h-4 bg-green-500 rounded mr-2"></span>
          Completed ({completionDates.length} days)
        </div>
      </div>
    </div>
  );
}
