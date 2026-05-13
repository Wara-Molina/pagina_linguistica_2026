'use client';

import {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ==================== TYPES ====================

interface EventoCalendar {
  evento_id: number;

  evento_titulo: string;

  evento_fecha: string;

  evento_hora?: string;

  evento_lugar?: string;

  evento_estado?: string;
}

interface CalendarWidgetProps {
  colores?: {
    color_primario?: string;

    color_secundario?: string;
  };

  eventos?: EventoCalendar[];
}

// ==================== SECURITY ====================

const isValidHexColor = (
  color?: string
): boolean => {
  if (
    typeof color !==
    'string'
  ) {
    return false;
  }

  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    color.trim()
  );
};

const getSafeColor = (
  color: string | undefined,
  fallback: string
): string => {
  if (
    typeof color ===
      'string' &&
    isValidHexColor(color)
  ) {
    return color;
  }

  return fallback;
};

const hexToRgba = (
  hex: string,
  alpha: number
): string => {
  const cleanHex =
    hex.replace('#', '');

  const r = parseInt(
    cleanHex.substring(0, 2),
    16
  );

  const g = parseInt(
    cleanHex.substring(2, 4),
    16
  );

  const b = parseInt(
    cleanHex.substring(4, 6),
    16
  );

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ==================== COMPONENT ====================

export default function CalendarWidget({
  colores,
  eventos = [],
}: CalendarWidgetProps) {
  const primaryColor =
    getSafeColor(
      colores?.color_primario,
      '#04246C'
    );

  const secondaryColor =
    getSafeColor(
      colores?.color_secundario,
      '#0A174E'
    );

  const today =
    new Date();

  const [
    currentDate,
    setCurrentDate,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  // ==================== CALENDAR ====================

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const weekDays = [
    'Lu',
    'Ma',
    'Mi',
    'Ju',
    'Vi',
    'Sa',
    'Do',
  ];

  const currentMonth =
    currentDate.getMonth();

  const currentYear =
    currentDate.getFullYear();

  const firstDay =
    new Date(
      currentYear,
      currentMonth,
      1
    );

  const lastDay =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    );

  let startDay =
    firstDay.getDay() -
    1;

  if (
    startDay < 0
  ) {
    startDay = 6;
  }

  const totalDays =
    lastDay.getDate();

  // ==================== EVENTS MAP ====================

  const eventDays =
    useMemo(() => {
      const map =
        new Map<
          string,
          EventoCalendar[]
        >();

      eventos.forEach(
        (
          evento
        ) => {
          const date =
            new Date(
              evento.evento_fecha
            );

          if (
            isNaN(
              date.getTime()
            )
          ) {
            return;
          }

          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

          if (
            !map.has(
              key
            )
          ) {
            map.set(
              key,
              []
            );
          }

          map
            .get(
              key
            )
            ?.push(
              evento
            );
        }
      );

      return map;
    }, [eventos]);

  // ==================== NAVIGATION ====================

  const prevMonth =
    () => {
      setCurrentDate(
        new Date(
          currentYear,
          currentMonth -
            1,
          1
        )
      );
    };

  const nextMonth =
    () => {
      setCurrentDate(
        new Date(
          currentYear,
          currentMonth +
            1,
          1
        )
      );
    };

  // ==================== DAYS ====================

  const days = [];

  for (
    let i = 0;
    i < startDay;
    i++
  ) {
    days.push(
      <div
        key={`empty-${i}`}
      />
    );
  }

  for (
    let day = 1;
    day <=
    totalDays;
    day++
  ) {
    const key = `${currentYear}-${currentMonth}-${day}`;

    const dayEvents =
      eventDays.get(
        key
      ) || [];

    const hasEvents =
      dayEvents.length >
      0;

    const isToday =
      today.getDate() ===
        day &&
      today.getMonth() ===
        currentMonth &&
      today.getFullYear() ===
        currentYear;

    days.push(
      <div
        key={day}
        className="relative aspect-square"
      >
        <div
          className={`w-full h-full rounded-xl flex items-center justify-center text-sm font-semibold transition-all cursor-default ${
            isToday
              ? 'text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={
            isToday
              ? {
                  background:
                    primaryColor,
                }
              : hasEvents
                ? {
                    background:
                      `${hexToRgba(primaryColor, 0.08)}`,
                  }
                : {}
          }
        >
          {day}
        </div>

        {hasEvents && (
          <div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{
              background:
                secondaryColor,
            }}
          />
        )}
      </div>
    );
  }

  // ==================== UPCOMING ====================

  const upcoming =
    eventos
      .filter(
        (
          evento
        ) => {
          const date =
            new Date(
              evento.evento_fecha
            );

          return (
            date >=
            today
          );
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            a.evento_fecha
          ).getTime() -
          new Date(
            b.evento_fecha
          ).getTime()
      )
      .slice(0, 3);

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <button
          onClick={
            prevMonth
          }
          className="w-10 h-10 rounded-xl border hover:bg-gray-100 transition-colors flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <h3 className="font-bold text-lg text-gray-900">
          {
            monthNames[
              currentMonth
            ]
          }{' '}
          {
            currentYear
          }
        </h3>

        <button
          onClick={
            nextMonth
          }
          className="w-10 h-10 rounded-xl border hover:bg-gray-100 transition-colors flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* WEEK */}

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(
          (
            day
          ) => (
            <div
              key={
                day
              }
              className="text-center text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              {day}
            </div>
          )
        )}
      </div>

      {/* DAYS */}

      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>

      {/* EVENTS */}

      {upcoming.length >
        0 && (
        <div className="pt-6 border-t">
          <h4 className="font-bold text-gray-900 mb-4">
            Próximos
            eventos
          </h4>

          <div className="space-y-3">
            {upcoming.map(
              (
                evento
              ) => (
                <Link
                  key={
                    evento.evento_id
                  }
                  href={`/eventos/${evento.evento_id}`}
                  className="block"
                >
                  <div
                    className="p-4 rounded-2xl border transition-all hover:shadow-md"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.03)}`,

                      borderColor:
                        `${hexToRgba(primaryColor, 0.12)}`,
                    }}
                  >
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                      {
                        evento.evento_titulo
                      }
                    </p>

                    <p className="text-xs text-gray-600">
                      {new Date(
                        evento.evento_fecha
                      ).toLocaleDateString(
                        'es-BO',
                        {
                          day: 'numeric',

                          month:
                            'short',
                        }
                      )}
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}