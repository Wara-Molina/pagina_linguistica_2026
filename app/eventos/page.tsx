'use client';

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from 'react';

import {
  useSearchParams,
  useRouter,
} from 'next/navigation';

import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import Link from 'next/link';

import api from '@/lib/axios';

import {
  getStorageUrl,
} from '@/lib/utils';

import {
  sanitizeHTML,
  sanitizeText,
} from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

import CalendarWidget from '@/components/CalendarWidget';

// ==================== TYPES ====================

interface Evento {
  evento_id: number;

  evento_titulo: string;

  evento_imagen?: string;

  evento_descripcion?: string;

  evento_fecha: string;

  evento_hora?: string;

  evento_lugar?: string;

  tipo_evento: string;
}

interface InstitucionData {
  institucion_nombre?: string;

  institucion_iniciales?: string;

  colorinstitucion?: Array<{
    color_primario?: string;

    color_secundario?: string;

    color_terciario?: string;
  }>;
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

const isValidImageUrl = (
  url?: string
): boolean => {
  if (
    !url ||
    typeof url !==
      'string'
  ) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    const allowedDomains =
      [
        'upea.bo',
        'archivosminio.upea.bo',
        'localhost',
        '127.0.0.1',
      ];

    const validDomain =
      allowedDomains.some(
        (
          domain
        ) =>
          parsed.hostname ===
            domain ||
          parsed.hostname.endsWith(
            `.${domain}`
          )
      );

    const validExtension =
      /\.(jpg|jpeg|png|webp|gif)$/i.test(
        parsed.pathname
      );

    return (
      parsed.protocol ===
        'https:' &&
      validDomain &&
      validExtension
    );
  } catch {
    return false;
  }
};

const sanitizeSearch = (
  text: string
): string => {
  return text
    .replace(
      /[<>\"'&{}]/g,
      ''
    )
    .trim()
    .slice(0, 120);
};

// ==================== COMPONENT ====================

function EventosContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const rawPage =
    Number(
      searchParams.get(
        'pagina'
      )
    );

  const currentPage =
    Number.isInteger(
      rawPage
    ) &&
    rawPage > 0
      ? rawPage
      : 1;

  const itemsPerPage = 5;

  const [eventos, setEventos] =
    useState<Evento[]>(
      []
    );

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<
      string | null
    >(null);

  const [search, setSearch] =
    useState('');

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#0A174E');

  const [
    tertiaryColor,
    setTertiaryColor,
  ] = useState('#020733');

  // ==================== FETCH ====================

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        try {
          setLoading(true);

          const institucionId =
            Number(
              process.env
                .NEXT_PUBLIC_INSTITUCION_ID
            ) || 41;

          const [
            eventosRes,
            instRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/gacetaEventos`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (
            !mounted
          )
            return;

          const eventosData =
            (
              eventosRes
                .data
                ?.upea_evento ||
              []
            )
              .filter(
                (
                  e: any
                ) =>
                  e.evento_id
              )
              .map(
                (
                  e: any
                ) => ({
                  evento_id:
                    Number(
                      e.evento_id
                    ),

                  evento_titulo:
                    sanitizeText(
                      e.evento_titulo,
                      200
                    ),

                  evento_imagen:
                    e.evento_imagen,

                  evento_descripcion:
                    sanitizeHTML(
                      e.evento_descripcion ||
                        ''
                    ),

                  evento_fecha:
                    e.evento_fecha,

                  evento_hora:
                    e.evento_hora,

                  evento_lugar:
                    sanitizeText(
                      e.evento_lugar,
                      120
                    ),

                  tipo_evento:
                    sanitizeText(
                      e.tipo_evento,
                      50
                    ),
                })
              );

          setEventos(
            eventosData
          );

          setInstitucion(
            instRes.data
              ?.Descripcion ||
              null
          );

          const colors =
            instRes.data
              ?.Descripcion
              ?.colorinstitucion?.[0];

          if (
            colors
          ) {
            setPrimaryColor(
              getSafeColor(
                colors.color_primario,
                '#04246C'
              )
            );

            setSecondaryColor(
              getSafeColor(
                colors.color_secundario,
                '#0A174E'
              )
            );

            setTertiaryColor(
              getSafeColor(
                colors.color_terciario,
                '#020733'
              )
            );
          }
        } catch (
          error
        ) {
          console.error(
            error
          );

          setError(
            'Error cargando eventos'
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // ==================== SEARCH ====================

  const filteredEventos =
    useMemo(() => {
      const safeSearch =
        sanitizeSearch(
          search
        ).toLowerCase();

      if (
        !safeSearch
      ) {
        return eventos;
      }

      return eventos.filter(
        (
          evento
        ) =>
          evento.evento_titulo
            .toLowerCase()
            .includes(
              safeSearch
            ) ||
          evento.tipo_evento
            .toLowerCase()
            .includes(
              safeSearch
            ) ||
          evento.evento_lugar
            ?.toLowerCase()
            .includes(
              safeSearch
            )
      );
    }, [
      eventos,
      search,
    ]);

  // ==================== PAGINATION ====================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEventos.length /
          itemsPerPage
      )
    );

  const safePage =
    Math.min(
      Math.max(
        currentPage,
        1
      ),
      totalPages
    );

  const start =
    (safePage - 1) *
    itemsPerPage;

  const currentEventos =
    filteredEventos.slice(
      start,
      start +
        itemsPerPage
    );

  const changePage = (
    page: number
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      'pagina',
      String(page)
    );

router.replace(
  `/eventos?${params.toString()}`,
  {
    scroll: false,
  }
);

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    });
  };

  // ==================== DATE ====================

  const formatDate = (
    value?: string
  ) => {
    if (!value)
      return '';

    const date =
      new Date(value);

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return date.toLocaleDateString(
      'es-BO',
      {
        weekday:
          'long',

        year:
          'numeric',

        month:
          'long',

        day: 'numeric',
      }
    );
  };

  // ==================== TYPE STYLE ====================

  const getTypeStyle = (
    type: string
  ) => {
    const safeType =
      type?.toUpperCase() ||
      '';

    if (
      safeType.includes(
        'SEMINARIO'
      )
    ) {
      return {
        background:
          'rgba(245,158,11,0.12)',

        color:
          '#f59e0b',
      };
    }

    if (
      safeType.includes(
        'TALLER'
      )
    ) {
      return {
        background:
          `${hexToRgba(secondaryColor, 0.12)}`,

        color:
          secondaryColor,
      };
    }

    return {
      background:
        `${hexToRgba(primaryColor, 0.12)}`,

      color:
        primaryColor,
    };
  };

  // ==================== CALENDAR DATA ====================

  const calendarEvents =
    useMemo(
      () =>
        eventos.map(
          (
            evento
          ) => ({
            evento_id:
              evento.evento_id,

            evento_titulo:
              evento.evento_titulo,

            evento_fecha:
              evento.evento_fecha,

            evento_hora:
              evento.evento_hora,

            evento_lugar:
              evento.evento_lugar,

            evento_estado:
              '1',
          })
        ),
      [eventos]
    );

  // ==================== LOADING ====================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin"
            style={{
              borderColor:
                `${hexToRgba(primaryColor, 0.2)}`,

              borderTopColor:
                primaryColor,
            }}
          />
        </div>

        <Footer />
      </div>
    );
  }

  // ==================== ERROR ====================

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              ⚠️
            </div>

            <h1 className="text-4xl font-bold mb-4">
              {error}
            </h1>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="px-8 py-4 rounded-full text-white font-semibold"
              style={{
                background:
                  primaryColor,
              }}
            >
              Reintentar
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden py-28"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />

          <div className="relative max-w-7xl mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-8">
                <Calendar className="w-5 h-5 text-white" />

                <span className="text-white text-sm font-medium">
                  Eventos
                  Académicos
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white font-serif leading-tight mb-6">
                Eventos
              </h1>

              <p className="text-white/80 text-lg md:text-xl max-w-3xl leading-relaxed mb-10">
                Participa en
                actividades,
                conferencias y
                encuentros de{' '}
                {
                  institucion?.institucion_nombre
                }
              </p>

              {/* SEARCH */}

              <div className="max-w-2xl">
                <div
                  className={`relative flex items-center rounded-2xl transition-all ${
                    searchFocused
                      ? 'ring-2 ring-white/50'
                      : ''
                  }`}
                  style={{
                    background:
                      'rgba(255,255,255,0.96)',
                  }}
                >
                  <Search
                    className="absolute left-5 w-5 h-5"
                    style={{
                      color:
                        primaryColor,
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={
                      search
                    }
                    onChange={(
                      e
                    ) =>
                      setSearch(
                        e
                          .target
                          .value
                      )
                    }
                    onFocus={() =>
                      setSearchFocused(
                        true
                      )
                    }
                    onBlur={() =>
                      setSearchFocused(
                        false
                      )
                    }
                    className="w-full pl-14 pr-14 py-5 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none"
                  />

                  {search && (
                    <button
                      onClick={() =>
                        setSearch(
                          ''
                        )
                      }
                      className="absolute right-4 p-2 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>

                <div className="mt-4 text-white/80 text-sm">
                  {
                    filteredEventos.length
                  }{' '}
                  evento
                  {filteredEventos.length !==
                  1
                    ? 's'
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* EVENTS */}

            <div className="lg:col-span-2">
              {currentEventos.length ===
              0 ? (
                <div className="bg-white rounded-[32px] border shadow-sm p-16 text-center">
                  <div
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.1)}`,
                    }}
                  >
                    <Calendar
                      className="w-10 h-10"
                      style={{
                        color:
                          primaryColor,
                      }}
                    />
                  </div>

                  <h2 className="text-3xl font-bold mb-4">
                    No se
                    encontraron
                    eventos
                  </h2>

                  <p className="text-gray-600 mb-8">
                    Intenta otra
                    búsqueda.
                  </p>

                  <button
                    onClick={() =>
                      setSearch(
                        ''
                      )
                    }
                    className="px-8 py-4 rounded-full text-white font-semibold"
                    style={{
                      background:
                        primaryColor,
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-8">
                    {currentEventos.map(
                      (
                        evento
                      ) => {
                        const imageUrl =
                          evento.evento_imagen
                            ? getStorageUrl(
                                evento.evento_imagen
                              )
                            : '';

                        const safeImage =
                          isValidImageUrl(
                            imageUrl
                          );

                        return (
                          <Link
                            key={
                              evento.evento_id
                            }
                            href={`/eventos/${evento.evento_id}`}
                            className="group block"
                          >
                            <article className="bg-white rounded-[32px] overflow-hidden border shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                              {/* IMAGE */}

                              {safeImage && (
                                <div className="relative h-72 overflow-hidden">
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      evento.evento_titulo
                                    }
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                  />

                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                </div>
                              )}

                              {/* CONTENT */}

                              <div className="p-8">
                                {/* TYPE */}

                                <div
                                  className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold mb-5"
                                  style={getTypeStyle(
                                    evento.tipo_evento
                                  )}
                                >
                                  {
                                    evento.tipo_evento
                                  }
                                </div>

                                {/* TITLE */}

                                <h2 className="text-3xl font-bold text-gray-900 mb-5 line-clamp-2">
                                  {
                                    evento.evento_titulo
                                  }
                                </h2>

                                {/* DESC */}

                                {evento.evento_descripcion && (
                                  <div
                                    className="text-gray-600 leading-relaxed mb-8 line-clamp-3"
                                    dangerouslySetInnerHTML={{
__html:
  sanitizeHTML(
    evento.evento_descripcion ||
      ''
  ),
                                    }}
                                  />
                                )}

                                {/* INFO */}

                                <div className="grid md:grid-cols-3 gap-5 pt-6 border-t">
                                  <div className="flex items-start gap-3">
                                    <Calendar
                                      className="w-5 h-5 mt-0.5"
                                      style={{
                                        color:
                                          primaryColor,
                                      }}
                                    />

                                    <div>
                                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                                        Fecha
                                      </p>

                                      <p className="text-sm text-gray-700">
                                        {formatDate(
                                          evento.evento_fecha
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <Clock
                                      className="w-5 h-5 mt-0.5"
                                      style={{
                                        color:
                                          primaryColor,
                                      }}
                                    />

                                    <div>
                                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                                        Hora
                                      </p>

                                      <p className="text-sm text-gray-700">
                                        {evento.evento_hora ||
                                          'Por confirmar'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <MapPin
                                      className="w-5 h-5 mt-0.5"
                                      style={{
                                        color:
                                          primaryColor,
                                      }}
                                    />

                                    <div>
                                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                                        Lugar
                                      </p>

                                      <p className="text-sm text-gray-700">
                                        {evento.evento_lugar ||
                                          'Por confirmar'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          </Link>
                        );
                      }
                    )}
                  </div>

                  {/* PAGINATION */}

                  {totalPages >
                    1 && (
                    <div className="flex items-center justify-center gap-3 mt-16">
                      <button
                        onClick={() =>
                          changePage(
                            safePage -
                              1
                          )
                        }
                        disabled={
                          safePage ===
                          1
                        }
                        className="w-12 h-12 rounded-2xl border bg-white disabled:opacity-40"
                      >
                        <ChevronLeft className="w-5 h-5 mx-auto" />
                      </button>

                      {Array.from(
                        {
                          length:
                            totalPages,
                        },
                        (
                          _,
                          i
                        ) =>
                          i + 1
                      )
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            page
                          ) => (
                            <button
                              key={
                                page
                              }
                              onClick={() =>
                                changePage(
                                  page
                                )
                              }
                              className={`w-12 h-12 rounded-2xl font-semibold transition-all ${
                                safePage ===
                                page
                                  ? 'text-white shadow-lg scale-110'
                                  : 'bg-white border'
                              }`}
                              style={
                                safePage ===
                                page
                                  ? {
                                      background:
                                        primaryColor,
                                    }
                                  : {}
                              }
                            >
                              {
                                page
                              }
                            </button>
                          )
                        )}

                      <button
                        onClick={() =>
                          changePage(
                            safePage +
                              1
                          )
                        }
                        disabled={
                          safePage ===
                          totalPages
                        }
                        className="w-12 h-12 rounded-2xl border bg-white disabled:opacity-40"
                      >
                        <ChevronRight className="w-5 h-5 mx-auto" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* SIDEBAR */}

            <div className="space-y-8">
              {/* CALENDAR */}

              <div className="sticky top-24">
                <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden mb-8">
                  <div
                    className="p-6 border-b"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.05)}`,
                    }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <Calendar
                        className="w-6 h-6"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />

                      Calendario
                    </h2>
                  </div>

                  <div className="p-6">
                    <CalendarWidget
                      colores={{
                        color_primario:
                          primaryColor,

                        color_secundario:
                          secondaryColor,
                      }}
                      eventos={
                        calendarEvents
                      }
                    />
                  </div>
                </div>

                {/* QUICK */}

                <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
                  <div
                    className="p-6 border-b"
                    style={{
                      background:
                        `${hexToRgba(secondaryColor, 0.05)}`,
                    }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900">
                      Próximos
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {eventos
                      .slice(
                        0,
                        4
                      )
                      .map(
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
                              className="p-5 rounded-2xl border hover:shadow-lg transition-all"
                              style={{
                                background:
                                  `${hexToRgba(primaryColor, 0.03)}`,

                                borderColor:
                                  `${hexToRgba(primaryColor, 0.12)}`,
                              }}
                            >
                              <h3 className="font-bold text-gray-900 line-clamp-2 mb-3">
                                {
                                  evento.evento_titulo
                                }
                              </h3>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar
                                  className="w-4 h-4"
                                  style={{
                                    color:
                                      primaryColor,
                                  }}
                                />

                                {new Date(
                                  evento.evento_fecha
                                ).toLocaleDateString(
                                  'es-BO'
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function EventosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <EventosContent />
    </Suspense>
  );
}