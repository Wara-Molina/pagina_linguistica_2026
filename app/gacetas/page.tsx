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
  FileText,
  Calendar,
  Search,
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import Link from 'next/link';

import api from '@/lib/axios';

import {
  sanitizeText,
} from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ==================== TYPES ====================

interface Gaceta {
  gaceta_id: number;

  gaceta_titulo: string;

  gaceta_fecha: string;

  gaceta_documento?: string;

  gaceta_tipo?: string;
}

interface InstitucionData {
  institucion_nombre?: string;

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

const sanitizeSearchQuery = (
  query: string
): string => {
  return query
    .replace(
      /[<>\"'&{}]/g,
      ''
    )
    .trim()
    .slice(0, 120);
};

// ==================== COMPONENT ====================

function GacetasContent() {
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

  const itemsPerPage = 6;

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<
      string | null
    >(null);

  const [gacetas, setGacetas] =
    useState<Gaceta[]>(
      []
    );

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [search, setSearch] =
    useState('');

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  const [filter, setFilter] =
    useState('TODOS');

  const [types, setTypes] =
    useState<string[]>(
      []
    );

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#0A174E');

  // ==================== RESET PAGE ====================

  useEffect(() => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      'pagina',
      '1'
    );

    router.replace(
      `/gacetas?${params.toString()}`,
      {
        scroll: false,
      }
    );
  }, [filter, search]);

  // ==================== FETCH ====================

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        try {
          setLoading(true);

          const institucionId =
            Math.max(
              1,
              Number(
                process.env
                  .NEXT_PUBLIC_INSTITUCION_ID
              ) || 32
            );

          const [
            gacetaRes,
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
          ) {
            return;
          }

          const rawData =
            gacetaRes.data
              ?.upea_gaceta_universitaria;

          if (
            !Array.isArray(
              rawData
            )
          ) {
            setError(
              'No existen gacetas disponibles'
            );

            return;
          }

          const data =
            rawData.map(
              (
                g: any
              ) => ({
                gaceta_id:
                  Number(
                    g.gaceta_id
                  ) || 0,

                gaceta_titulo:
                  sanitizeText(
                    g.gaceta_titulo ||
                      'Sin título',
                    220
                  ),

                gaceta_fecha:
                  g.gaceta_fecha ||
                  '',

                gaceta_documento:
                  g.gaceta_documento ||
                  '',

                gaceta_tipo:
                  sanitizeText(
                    g.gaceta_tipo ||
                      'GACETA',
                    50
                  ),
              })
            );

          setGacetas(
            data
          );

          setInstitucion(
            instRes.data
              ?.Descripcion ||
              null
          );

          const uniqueTypes =
            Array.from(
              new Set(
                data
                  .map(
                    (
                      g: Gaceta
                    ) =>
                      g.gaceta_tipo
                  )
                  .filter(
                    Boolean
                  )
              )
            ) as string[];

          setTypes([
            'TODOS',
            ...uniqueTypes,
          ]);

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
          }
        } catch (
          error
        ) {
          if (
            process.env.NODE_ENV !==
            'production'
          ) {
            console.error(
              error
            );
          }

          setError(
            'Error cargando gacetas'
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

  // ==================== FILTER ====================

  const filtered =
    useMemo(() => {
      const safeSearch =
        sanitizeSearchQuery(
          search
        ).toLowerCase();

      const byType =
        filter ===
        'TODOS'
          ? gacetas
          : gacetas.filter(
              (
                g
              ) =>
                g.gaceta_tipo ===
                filter
            );

      if (
        !safeSearch
      ) {
        return byType;
      }

      return byType.filter(
        (
          g
        ) =>
          g.gaceta_titulo
            .toLowerCase()
            .includes(
              safeSearch
            ) ||
          g.gaceta_tipo
            ?.toLowerCase()
            .includes(
              safeSearch
            )
      );
    }, [
      gacetas,
      filter,
      search,
    ]);

  // ==================== PAGINATION ====================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
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

  const startIndex =
    (safePage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex +
    itemsPerPage;

  const currentItems =
    filtered.slice(
      startIndex,
      endIndex
    );

  const visiblePages =
    useMemo(() => {
      const delta = 2;

      const range: number[] =
        [];

      const rangeWithDots:
        | (
            number | string
          )[]
        = [];

      let lastPage = 0;

      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >=
            safePage -
              delta &&
            i <=
              safePage +
                delta)
        ) {
          range.push(i);
        }
      }

      for (const page of range) {
        if (
          lastPage
        ) {
          if (
            page -
              lastPage ===
            2
          ) {
            rangeWithDots.push(
              lastPage + 1
            );
          } else if (
            page -
              lastPage >
            2
          ) {
            rangeWithDots.push(
              '...'
            );
          }
        }

        rangeWithDots.push(
          page
        );

        lastPage = page;
      }

      return rangeWithDots;
    }, [
      safePage,
      totalPages,
    ]);

  const changePage = (
    page: number
  ) => {
    const validPage =
      Math.min(
        Math.max(
          page,
          1
        ),
        totalPages
      );

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      'pagina',
      String(
        validPage
      )
    );

    router.push(
      `/gacetas?${params.toString()}`,
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
        year:
          'numeric',

        month:
          'long',

        day: 'numeric',
      }
    );
  };

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

            <h2 className="text-3xl font-bold mb-4">
              {error}
            </h2>

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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden py-28"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
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
                <FileText className="w-5 h-5 text-white" />

                <span className="text-white text-sm font-medium">
                  Gaceta
                  Universitaria
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white font-serif leading-tight mb-6">
                Gacetas
                Oficiales
              </h1>

              <p className="text-white/80 text-lg md:text-xl max-w-3xl leading-relaxed mb-10">
                Resoluciones,
                documentos y
                publicaciones
                oficiales de{' '}
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
                    placeholder="Buscar gacetas..."
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
                    filtered.length
                  }{' '}
                  resultado
                  {filtered.length !==
                  1
                    ? 's'
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS */}

        <section className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <Filter
                className="w-5 h-5"
                style={{
                  color:
                    primaryColor,
                }}
              />

              {types.map(
                (
                  type
                ) => (
                  <button
                    key={
                      type
                    }
                    onClick={() =>
                      setFilter(
                        type
                      )
                    }
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      filter ===
                      type
                        ? 'text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={
                      filter ===
                      type
                        ? {
                            background:
                              primaryColor,
                          }
                        : {}
                    }
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* GRID */}

        <section className="max-w-7xl mx-auto px-6 py-16">
          {currentItems.length ===
          0 ? (
            <div className="text-center py-24">
              <div
                className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8"
                style={{
                  background:
                    `${hexToRgba(primaryColor, 0.1)}`,
                }}
              >
                <FileText
                  className="w-10 h-10"
                  style={{
                    color:
                      primaryColor,
                  }}
                />
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                No se
                encontraron
                gacetas
              </h3>

              <p className="text-gray-600 mb-8">
                Intenta cambiar
                los filtros o
                realizar otra
                búsqueda.
              </p>

              <button
                onClick={() => {
                  setSearch(
                    ''
                  );

                  setFilter(
                    'TODOS'
                  );
                }}
                className="px-8 py-4 rounded-full text-white font-semibold"
                style={{
                  background:
                    primaryColor,
                }}
              >
                Limpiar
                filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {currentItems.map(
                  (
                    gaceta
                  ) => (
                    <Link
                      key={
                        gaceta.gaceta_id
                      }
                      href={`/gacetas/${gaceta.gaceta_id}`}
                      className="group"
                    >
                      <article className="bg-white rounded-[32px] overflow-hidden border shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                        <div
                          className="relative h-44 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.12)}, ${hexToRgba(secondaryColor, 0.08)})`,
                          }}
                        >
                          <FileText
                            className="w-20 h-20 transition-transform duration-500 group-hover:scale-110"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />

                          <div className="absolute top-5 right-5 px-4 py-1.5 rounded-full text-xs font-bold bg-white/95 shadow-lg">
                            PDF
                          </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                          {gaceta.gaceta_tipo && (
                            <span
                              className="inline-flex w-fit px-4 py-1.5 rounded-full text-xs font-bold mb-5"
                              style={{
                                background:
                                  `${hexToRgba(primaryColor, 0.1)}`,
                                color:
                                  primaryColor,
                              }}
                            >
                              {
                                gaceta.gaceta_tipo
                              }
                            </span>
                          )}

                          <h2 className="text-2xl font-bold text-gray-900 mb-6 line-clamp-3 group-hover:text-gray-700 transition-colors">
                            {
                              gaceta.gaceta_titulo
                            }
                          </h2>

                          <div className="mt-auto pt-6 border-t flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />

                              {formatDate(
                                gaceta.gaceta_fecha
                              )}
                            </div>

                            <div
                              className="flex items-center gap-2 font-semibold text-sm"
                              style={{
                                color:
                                  primaryColor,
                              }}
                            >
                              Ver

                              <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                )}
              </div>

              {/* PAGINATION */}

              {totalPages >
                1 && (
                <div className="flex flex-col items-center gap-6 mt-20">
                  <div className="text-sm text-gray-500">
                    Página{' '}
                    <span className="font-bold text-gray-900">
                      {
                        safePage
                      }
                    </span>{' '}
                    de{' '}
                    <span className="font-bold text-gray-900">
                      {
                        totalPages
                      }
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
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
                      className="w-12 h-12 rounded-2xl border bg-white shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 mx-auto" />
                    </button>

                    {visiblePages.map(
                      (
                        page,
                        index
                      ) => {
                        if (
                          page ===
                          '...'
                        ) {
                          return (
                            <div
                              key={`dots-${index}`}
                              className="w-12 h-12 flex items-center justify-center text-gray-400 font-bold"
                            >
                              ...
                            </div>
                          );
                        }

                        const isActive =
                          safePage ===
                          page;

                        return (
                          <button
                            key={
                              page
                            }
                            onClick={() =>
                              changePage(
                                Number(
                                  page
                                )
                              )
                            }
                            className={`min-w-[48px] h-12 px-4 rounded-2xl font-semibold transition-all ${
                              isActive
                                ? 'text-white scale-110 shadow-xl'
                                : 'bg-white border hover:shadow-md'
                            }`}
                            style={
                              isActive
                                ? {
                                    background:
                                      primaryColor,
                                  }
                                : {}
                            }
                          >
                            {page}
                          </button>
                        );
                      }
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
                      className="w-12 h-12 rounded-2xl border bg-white shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function GacetasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <GacetasContent />
    </Suspense>
  );
}