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
  FileText,
  Bell,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Megaphone,
} from 'lucide-react';

import Link from 'next/link';

import Image from 'next/image';

import api from '@/lib/axios';

import {
  getStorageUrl,
} from '@/lib/utils';

import {
  sanitizeHTML,
  sanitizeText,
  sanitizeQueryParam,
} from '@/lib/security';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ================= TYPES =================

interface ColorInstitucion {
  color_primario?: string;

  color_secundario?: string;

  color_terciario?: string;
}

interface Comunicado {
  idconvocatorias: number;

  con_foto_portada?: string;

  con_titulo: string;

  con_descripcion?: string;

  con_estado: string;

  con_fecha_inicio?: string;

  con_fecha_fin?: string;

  tipo_conv_comun?: {
    idtipo_conv_comun: number;

    tipo_conv_comun_titulo: string;

    tipo_conv_comun_estado: string;
  };
}

interface InstitucionData {
  institucion_nombre?: string;

  institucion_iniciales?: string;

  colorinstitucion?: ColorInstitucion[];
}

type TipoComunicado =
  | 'TODOS'
  | 'CONVOCATORIAS'
  | 'AVISOS'
  | 'COMUNICADOS';

// ================= SECURITY =================

const isValidHexColor = (
  color?: string
): boolean => {
  if (!color) {
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

const isSafeImageUrl = (
  url?: string
): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    return (
      parsed.protocol ===
        'https:' &&
      (parsed.hostname.includes(
        'upea.bo'
      ) ||
        parsed.hostname.includes(
          'localhost'
        ))
    );
  } catch {
    return false;
  }
};

const searchComunicados = (
  comunicados: Comunicado[],
  query: string
): Comunicado[] => {
  if (
    !query.trim()
  ) {
    return comunicados;
  }

  const safeQuery =
    sanitizeQueryParam(
      query
    ).toLowerCase();

  return comunicados.filter(
    (
      comunicado
    ) => {
      const title =
        comunicado.con_titulo?.toLowerCase() ||
        '';

      const description =
        comunicado.con_descripcion?.toLowerCase() ||
        '';

      return (
        title.includes(
          safeQuery
        ) ||
        description.includes(
          safeQuery
        )
      );
    }
  );
};

// ================= COMPONENT =================

function ComunicadosContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

const getInitialTipo =
  (): TipoComunicado => {
    const tipo =
      sanitizeQueryParam(
        searchParams.get(
          'tipo'
        ) || ''
      ).toUpperCase();

    const tiposValidos: TipoComunicado[] =
      [
        'TODOS',
        'CONVOCATORIAS',
        'AVISOS',
        'COMUNICADOS',
      ];

    return tiposValidos.includes(
      tipo as TipoComunicado
    )
      ? (tipo as TipoComunicado)
      : 'TODOS';
  };

const [tipoActivo, setTipoActivo] =
  useState<TipoComunicado>(
    getInitialTipo()
  );

  const [busqueda, setBusqueda] =
    useState('');

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const itemsPorPagina =
    6;

  const [
    comunicados,
    setComunicados,
  ] =
    useState<
      Comunicado[]
    >([]);

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  // COLORS

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#FC0102');

  const [
    tertiaryColor,
    setTertiaryColor,
  ] = useState('#020733');

  // ================= TYPES =================

  const tipos: Array<{
    id: TipoComunicado;

    label: string;

    icon: React.ElementType;
  }> = [
    {
      id: 'TODOS',

      label: 'Todos',

      icon: FileText,
    },

    {
      id: 'CONVOCATORIAS',

      label:
        'Convocatorias',

      icon:
        Calendar,
    },

    {
      id: 'AVISOS',

      label:
        'Avisos',

      icon: Bell,
    },

    {
      id: 'COMUNICADOS',

      label:
        'Comunicados',

      icon:
        Megaphone,
    },
  ];

  // ================= FETCH =================

  useEffect(() => {
    let mounted =
      true;

    const fetchData =
      async () => {
        try {
          setLoading(
            true
          );

          const institucionId =
            Number(
              process.env
                .NEXT_PUBLIC_INSTITUCION_ID
            ) || 41;

          const [
            comunicadosRes,
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

          const comunicadosData: Comunicado[] =
            comunicadosRes
              .data
              ?.convocatorias?.filter(
                (
                  c: Comunicado
                ) =>
                  c.con_estado ===
                  '1'
              ) || [];

          setComunicados(
            comunicadosData
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
                '#FC0102'
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
        } finally {
          if (
            mounted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    fetchData();

    return () => {
      mounted =
        false;
    };
  }, []);

  // ================= URL =================

  useEffect(() => {
    const currentTipo =
      searchParams.get(
        'tipo'
      );

    if (
      currentTipo !==
        tipoActivo &&
      tipoActivo !==
        'TODOS'
    ) {
      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      params.set(
        'tipo',
        sanitizeQueryParam(
          tipoActivo
        )
      );

      router.replace(
        `/comunicados?${params.toString()}`,
        {
          scroll:
            false,
        }
      );
    } else if (
      tipoActivo ===
        'TODOS' &&
      currentTipo
    ) {
      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      params.delete(
        'tipo'
      );

      router.replace(
        `/comunicados?${params.toString()}`,
        {
          scroll:
            false,
        }
      );
    }

    setPaginaActual(
      1
    );
  }, [
    tipoActivo,
    searchParams,
    router,
  ]);

  // ================= FILTER =================

const comunicadosFiltrados =
  useMemo(() => {
    let filtrados =
      [...comunicados];

    if (
      tipoActivo !==
      'TODOS'
    ) {
      filtrados =
        filtrados.filter(
          (
            comunicado
          ) =>
            comunicado.tipo_conv_comun?.tipo_conv_comun_titulo
              ?.trim()
              ?.toUpperCase() ===
            tipoActivo
        );
    }

    return searchComunicados(
      filtrados,
      busqueda
    );
  }, [
    comunicados,
    tipoActivo,
    busqueda,
  ]);

  // ================= PAGINATION =================

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        comunicadosFiltrados.length /
          itemsPorPagina
      )
    );

  const safePaginaActual =
    Math.min(
      Math.max(
        1,
        paginaActual
      ),
      totalPaginas
    );

  const inicio =
    (safePaginaActual -
      1) *
    itemsPorPagina;

  const comunicadosPagina =
    comunicadosFiltrados.slice(
      inicio,
      inicio +
        itemsPorPagina
    );

  const cambiarPagina =
    (
      pagina: number
    ) => {
      if (
        pagina <
          1 ||
        pagina >
          totalPaginas
      ) {
        return;
      }

      setPaginaActual(
        pagina
      );

      window.scrollTo(
        {
          top: 0,

          behavior:
            'smooth',
        }
      );
    };

  // ================= HELPERS =================

  const getTipoColor =
    (
      tipo?: string
    ) => {
      const tipoUpper =
        tipo?.toUpperCase();

      if (
        tipoUpper ===
        'CONVOCATORIAS'
      ) {
        return {
          bg: `${hexToRgba(primaryColor, 0.15)}`,

          border: `${hexToRgba(primaryColor, 0.3)}`,

          text: primaryColor,
        };
      }

      if (
        tipoUpper ===
        'AVISOS'
      ) {
        return {
          bg: `${hexToRgba('#f59e0b', 0.15)}`,

          border: `${hexToRgba('#f59e0b', 0.3)}`,

          text:
            '#f59e0b',
        };
      }

      if (
        tipoUpper ===
        'COMUNICADOS'
      ) {
        return {
          bg: `${hexToRgba(secondaryColor, 0.15)}`,

          border: `${hexToRgba(secondaryColor, 0.3)}`,

          text:
            secondaryColor,
        };
      }

      return {
        bg: `${hexToRgba(primaryColor, 0.12)}`,

        border: `${hexToRgba(primaryColor, 0.2)}`,

        text:
          primaryColor,
      };
    };

  const formatDate = (
    dateString?: string
  ) => {
    if (
      !dateString
    ) {
      return 'Por definir';
    }

    try {
      return new Date(
        dateString
      ).toLocaleDateString(
        'es-BO',
        {
          year:
            'numeric',

          month:
            'short',

          day: 'numeric',
        }
      );
    } catch {
      return 'Por definir';
    }
  };

  // ================= LOADING =================

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

  // ================= PAGE =================

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden py-24 lg:py-32"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_30%)]" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl text-white text-sm uppercase tracking-[0.25em] font-semibold mb-8">
                <Megaphone className="w-4 h-4" />

                Comunicados
              </span>

              <h1 className="text-5xl md:text-7xl font-bold text-white font-serif leading-tight mb-8">
                Comunicados
                institucionales
              </h1>

              <p className="text-xl text-white/80 leading-relaxed max-w-3xl">
                Convocatorias,
                avisos y
                comunicados
                oficiales de{' '}
                <span className="font-semibold text-white">
                  {sanitizeText(
                    institucion?.institucion_nombre ||
                      'UPEA',
                    120
                  )}
                </span>
              </p>

              {/* SEARCH */}

              <div className="relative max-w-xl mt-12">
                <div
                  className={`relative flex items-center rounded-2xl transition-all ${
                    searchFocused
                      ? 'ring-2 ring-white/40'
                      : ''
                  }`}
                  style={{
                    background:
                      'rgba(255,255,255,0.95)',
                  }}
                >
                  <Search className="absolute left-4 w-5 h-5 text-gray-500" />

                  <input
                    type="text"
                    value={
                      busqueda
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
                    onChange={(
                      e
                    ) => {
                      setBusqueda(
                        sanitizeText(
                          e.target
                            .value,
                          100
                        )
                      );

                      setPaginaActual(
                        1
                      );
                    }}
                    placeholder="Buscar comunicados..."
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-gray-900 placeholder-gray-500 outline-none"
                  />

                  {busqueda.length >
                    0 && (
                    <button
                      onClick={() => {
                        setBusqueda(
                          ''
                        );

                        setPaginaActual(
                          1
                        );
                      }}
                      className="absolute right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>

                <div className="mt-3 text-sm text-white/70">
                  {
                    comunicadosFiltrados.length
                  }{' '}
                  resultados
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS */}

        <section className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {tipos.map(
                (
                  tipo
                ) => {
                  const isActive =
                    tipoActivo ===
                    tipo.id;

                  const count =
                    tipo.id ===
                    'TODOS'
                      ? comunicados.length
                      : comunicados.filter(
                          (
                            c
                          ) =>
                            c.tipo_conv_comun?.tipo_conv_comun_titulo?.toUpperCase() ===
                            tipo.id
                        )
                          .length;

                  const colors =
                    tipo.id ===
                    'TODOS'
                      ? {
                          text:
                            primaryColor,
                        }
                      : getTipoColor(
                          tipo.id
                        );

                  return (
                    <button
                      key={
                        tipo.id
                      }
                      onClick={() =>
                        setTipoActivo(
                          tipo.id
                        )
                      }
                      className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all ${
                        isActive
                          ? 'text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                colors.text,
                            }
                          : {}
                      }
                    >
                      <tipo.icon className="w-4 h-4" />

                      {
                        tipo.label
                      }

                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                        {
                          count
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* GRID */}

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            {comunicadosFiltrados.length ===
            0 ? (
              <div className="text-center py-24">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-8">
                  <FileText
                    className="w-12 h-12"
                    style={{
                      color:
                        primaryColor,
                    }}
                  />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  No se
                  encontraron
                  resultados
                </h2>

                <p className="text-gray-600 mb-8">
                  Intenta con
                  otra búsqueda
                </p>

                <button
                  onClick={() => {
                    setBusqueda(
                      ''
                    );

                    setTipoActivo(
                      'TODOS'
                    );
                  }}
                  className="px-8 py-4 rounded-full text-white font-semibold shadow-lg"
                  style={{
                    background:
                      primaryColor,
                  }}
                >
                  Ver todos
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {comunicadosPagina.map(
                    (
                      comunicado
                    ) => {
                      const colors =
                        getTipoColor(
                          comunicado
                            .tipo_conv_comun
                            ?.tipo_conv_comun_titulo
                        );

                      const tipo =
                        comunicado
                          .tipo_conv_comun
                          ?.tipo_conv_comun_titulo ||
                        'COMUNICADO';

                      const imageUrl =
                        comunicado.con_foto_portada
                          ? getStorageUrl(
                              comunicado.con_foto_portada
                            )
                          : '';

                      const safeImage =
                        isSafeImageUrl(
                          imageUrl
                        );

                      return (
                        <Link
                          key={
                            comunicado.idconvocatorias
                          }
                          href={`/comunicados/${comunicado.idconvocatorias}`}
                          className="group"
                        >
                          <div
                            className="bg-white rounded-[28px] overflow-hidden border shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full flex flex-col"
                            style={{
                              borderColor:
                                colors.border,
                            }}
                          >
                            {/* IMAGE */}

                            <div className="relative h-52 overflow-hidden">
                              {safeImage ? (
                                <>
                                  <Image
                                    src={
                                      imageUrl
                                    }
                                    alt={sanitizeText(
                                      comunicado.con_titulo,
                                      120
                                    )}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    sizes="(max-width:768px) 100vw, 33vw"
                                  />

                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </>
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{
                                    background: `linear-gradient(135deg, ${colors.bg}, ${hexToRgba(secondaryColor, 0.15)})`,
                                  }}
                                >
                                  {tipo ===
                                  'CONVOCATORIAS' ? (
                                    <Calendar className="w-16 h-16 text-white/70" />
                                  ) : tipo ===
                                    'AVISOS' ? (
                                    <Bell className="w-16 h-16 text-white/70" />
                                  ) : (
                                    <Megaphone className="w-16 h-16 text-white/70" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* CONTENT */}

                            <div className="p-7 flex-1 flex flex-col">
                              <span
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold w-fit mb-5"
                                style={{
                                  background:
                                    colors.bg,

                                  color:
                                    colors.text,
                                }}
                              >
                                {
                                  tipo
                                }
                              </span>

                              <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">
                                {sanitizeText(
                                  comunicado.con_titulo,
                                  150
                                )}
                              </h2>

                              {comunicado.con_descripcion && (
                                <div
                                  className="text-gray-600 line-clamp-3 leading-relaxed mb-6 flex-1"
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      sanitizeHTML(
                                        comunicado.con_descripcion
                                      ),
                                  }}
                                />
                              )}

                              {(comunicado.con_fecha_inicio ||
                                comunicado.con_fecha_fin) && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                                  <Calendar className="w-4 h-4" />

                                  <span>
                                    {formatDate(
                                      comunicado.con_fecha_inicio
                                    )}

                                    {comunicado.con_fecha_fin &&
                                      ` - ${formatDate(comunicado.con_fecha_fin)}`}
                                  </span>
                                </div>
                              )}

                              <div
                                className="pt-5 border-t flex items-center justify-between"
                                style={{
                                  borderColor:
                                    `${hexToRgba(primaryColor, 0.12)}`,
                                }}
                              >
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      colors.text,
                                  }}
                                >
                                  Ver detalle
                                </span>

                                <ArrowLeft
                                  className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform"
                                  style={{
                                    color:
                                      colors.text,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>

                {/* PAGINATION */}

                {totalPaginas >
                  1 && (
                  <div className="flex items-center justify-center gap-3 mt-16">
                    <button
                      onClick={() =>
                        cambiarPagina(
                          safePaginaActual -
                            1
                        )
                      }
                      disabled={
                        safePaginaActual ===
                        1
                      }
                      className="w-12 h-12 rounded-2xl border flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-all"
                      style={{
                        borderColor:
                          `${hexToRgba(primaryColor, 0.2)}`,
                      }}
                    >
                      <ChevronLeft
                        className="w-5 h-5"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />
                    </button>

                    {Array.from(
                      {
                        length:
                          Math.min(
                            totalPaginas,
                            5
                          ),
                      },
                      (
                        _,
                        i
                      ) => {
                        let pageNum =
                          i +
                          1;

                        if (
                          totalPaginas >
                          5
                        ) {
                          if (
                            safePaginaActual >
                            3
                          ) {
                            pageNum =
                              safePaginaActual -
                              2 +
                              i;
                          }

                          if (
                            pageNum >
                            totalPaginas
                          ) {
                            pageNum =
                              totalPaginas -
                              4 +
                              i;
                          }
                        }

                        return (
                          <button
                            key={
                              pageNum
                            }
                            onClick={() =>
                              cambiarPagina(
                                pageNum
                              )
                            }
                            className={`w-12 h-12 rounded-2xl font-semibold transition-all ${
                              safePaginaActual ===
                              pageNum
                                ? 'text-white shadow-lg scale-110'
                                : 'border hover:bg-gray-50'
                            }`}
                            style={
                              safePaginaActual ===
                              pageNum
                                ? {
                                    background:
                                      primaryColor,
                                  }
                                : {
                                    borderColor:
                                      `${hexToRgba(primaryColor, 0.2)}`,
                                  }
                            }
                          >
                            {
                              pageNum
                            }
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        cambiarPagina(
                          safePaginaActual +
                            1
                        )
                      }
                      disabled={
                        safePaginaActual ===
                        totalPaginas
                      }
                      className="w-12 h-12 rounded-2xl border flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-all"
                      style={{
                        borderColor:
                          `${hexToRgba(primaryColor, 0.2)}`,
                      }}
                    >
                      <ChevronRight
                        className="w-5 h-5"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ================= PAGE =================

export default function ComunicadosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <div className="flex-1 flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
          </div>

          <Footer />
        </div>
      }
    >
      <ComunicadosContent />
    </Suspense>
  );
}