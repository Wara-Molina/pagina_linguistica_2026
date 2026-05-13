'use client';

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from 'react';

import {
  FlaskConical,
  BookOpen,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Award,
  FileText,
  ArrowLeft,
  Search,
  X,
  ChevronRight,
  Microscope,
  GraduationCap,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import CalendarWidget from "@/components/CalendarWidget";
import Link from 'next/link';

import Image from 'next/image';

import api from '@/lib/axios';

import { getStorageUrl } from '@/lib/utils';

import {
  sanitizeHTML,
  sanitizeText,
  sanitizeQueryParam,
} from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ==================== TIPOS ====================

interface ColorInstitucion {
  color_primario?: string;

  color_secundario?: string;

  color_terciario?: string;
}

interface GacetaInvestigacion {
  gaceta_id: number;

  gaceta_titulo: string;

  gaceta_fecha: string;

  gaceta_documento?: string;

  gaceta_tipo: string;
}

interface EventoInvestigacion {
  evento_id: number;

  evento_titulo: string;

  evento_imagen?: string;

  evento_descripcion?: string;

  evento_fecha: string;

  evento_hora?: string;

  evento_lugar?: string;

  tipo_evento: string;
}

interface PublicacionInvestigacion {
  publicaciones_id: number;

  publicaciones_titulo: string;

  publicaciones_imagen?: string;

  publicaciones_descripcion?: string;

  publicaciones_documento?: string;

  publicaciones_fecha: string;

  publicaciones_autor?: string;

  publicaciones_tipo: string;
}

interface InstitucionData {
  institucion_nombre?: string;

  institucion_iniciales?: string;

  colorinstitucion?: ColorInstitucion[];
}

// ==================== SEGURIDAD ====================

const isValidHexColor = (
  color?: string
): boolean => {
  if (
    typeof color !== 'string'
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
    typeof color === 'string' &&
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

const isValidResourceUrl = (
  url?: string
): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    const allowedProtocols =
      ['https:'];

    const allowedDomains =
      [
        'upea.bo',
        'apiadministrador.upea.bo',
        'archivosminio.upea.bo',
        'localhost',
        '127.0.0.1',
      ];

    const validProtocol =
      allowedProtocols.includes(
        parsed.protocol
      );

    const validDomain =
      allowedDomains.some(
        (domain) =>
          parsed.hostname.includes(
            domain
          )
      );

    return (
      validProtocol &&
      validDomain
    );
  } catch {
    return false;
  }
};

const esTipoInvestigacion = (
  valor: unknown
): boolean => {
  if (!valor) {
    return false;
  }

  const normalized =
    String(valor)
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      );

  return (
    normalized ===
    'INSTITUTO DE INVESTIGACION'
  );
};

const searchItems = <
  T extends {
    gaceta_titulo?: string;

    evento_titulo?: string;

    publicaciones_titulo?: string;

    gaceta_descripcion?: string;

    evento_descripcion?: string;

    publicaciones_descripcion?: string;
  },
>(
  items: T[],
  query: string,
  titleKey: keyof T,
  descKey?: keyof T
): T[] => {
  if (!query.trim()) {
    return items;
  }

  const safeQuery =
    sanitizeQueryParam(
      query
    ).toLowerCase();

  return items.filter(
    (item) => {
      const title =
        String(
          item[
            titleKey
          ] || ''
        ).toLowerCase();

      const desc =
        descKey
          ? String(
              item[
                descKey
              ] || ''
            ).toLowerCase()
          : '';

      return (
        title.includes(
          safeQuery
        ) ||
        desc.includes(
          safeQuery
        )
      );
    }
  );
};

// ==================== COMPONENTE ====================

function InstitutoInvestigacionContent() {
  const rawInstitucionId =
    Number(
      process.env
        .NEXT_PUBLIC_INSTITUCION_ID
    );

  const institucionId =
    Number.isInteger(
      rawInstitucionId
    ) &&
    rawInstitucionId > 0
      ? rawInstitucionId
      : 41;

  const [
    gacetas,
    setGacetas,
  ] = useState<
    GacetaInvestigacion[]
  >([]);

  const [
    eventos,
    setEventos,
  ] = useState<
    EventoInvestigacion[]
  >([]);

  const [
    publicaciones,
    setPublicaciones,
  ] = useState<
    PublicacionInvestigacion[]
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

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [busqueda, setBusqueda] =
    useState('');

  const [activeTab, setActiveTab] =
    useState<
      | 'proyectos'
      | 'publicaciones'
      | 'eventos'
    >(
      'proyectos'
    );

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

  // ==================== FETCH ====================

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        try {
          setLoading(true);

          const [
            gacetaEventosRes,
            recursosRes,
            instRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/gacetaEventos`
              ),

              api.get(
                `/institucion/${institucionId}/recursos`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (!mounted)
            return;

          const gacetasData =
            (
              gacetaEventosRes
                .data
                ?.upea_gaceta_universitaria ||
              []
            )
              .filter(
                (
                  g: any
                ) =>
                  esTipoInvestigacion(
                    g.gaceta_tipo
                  )
              )
              .map(
                (
                  g: any
                ) => ({
                  gaceta_id:
                    Number(
                      g.gaceta_id
                    ),

                  gaceta_titulo:
                    sanitizeText(
                      g.gaceta_titulo,
                      200
                    ),

                  gaceta_fecha:
                    g.gaceta_fecha,

                  gaceta_documento:
                    isValidResourceUrl(
                      g.gaceta_documento
                    )
                      ? g.gaceta_documento
                      : undefined,

                  gaceta_tipo:
                    sanitizeText(
                      g.gaceta_tipo,
                      50
                    ),
                })
              );

          const eventosData =
            (
              gacetaEventosRes
                .data
                ?.upea_evento ||
              []
            )
              .filter(
                (
                  e: any
                ) =>
                  esTipoInvestigacion(
                    e.tipo_evento
                  )
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
                    isValidResourceUrl(
                      e.evento_imagen
                    )
                      ? e.evento_imagen
                      : undefined,

                  evento_descripcion:
                    sanitizeHTML(
                      e.evento_descripcion ||
                        ''
                    ),

                  evento_fecha:
                    e.evento_fecha,

                  evento_hora:
                    e.evento_hora?.substring(
                      0,
                      5
                    ) || '',

                  evento_lugar:
                    sanitizeText(
                      e.evento_lugar,
                      100
                    ),

                  tipo_evento:
                    sanitizeText(
                      e.tipo_evento,
                      50
                    ),
                })
              );

          const publicacionesData =
            (
              recursosRes
                .data
                ?.upea_publicaciones ||
              []
            )
              .filter(
                (
                  p: any
                ) =>
                  esTipoInvestigacion(
                    p.publicaciones_tipo
                  )
              )
              .map(
                (
                  p: any
                ) => ({
                  publicaciones_id:
                    Number(
                      p.publicaciones_id
                    ),

                  publicaciones_titulo:
                    sanitizeText(
                      p.publicaciones_titulo,
                      200
                    ),

                  publicaciones_imagen:
                    isValidResourceUrl(
                      p.publicaciones_imagen
                    )
                      ? p.publicaciones_imagen
                      : undefined,

                  publicaciones_descripcion:
                    sanitizeHTML(
                      p.publicaciones_descripcion ||
                        ''
                    ),

                  publicaciones_documento:
                    isValidResourceUrl(
                      p.publicaciones_documento
                    )
                      ? p.publicaciones_documento
                      : undefined,

                  publicaciones_fecha:
                    p.publicaciones_fecha,

                  publicaciones_autor:
                    sanitizeText(
                      p.publicaciones_autor,
                      100
                    ),

                  publicaciones_tipo:
                    sanitizeText(
                      p.publicaciones_tipo,
                      50
                    ),
                })
              );

          setGacetas(
            gacetasData
          );

          setEventos(
            eventosData
          );

          setPublicaciones(
            publicacionesData
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

          if (colors) {
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

          setError(
            'No se pudo cargar el instituto'
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
  }, [
    institucionId,
  ]);

  // ==================== MEMOS ====================

  const gacetasFiltradas =
    useMemo(
      () =>
        searchItems(
          gacetas,
          busqueda,
          'gaceta_titulo'
        ),
      [
        gacetas,
        busqueda,
      ]
    );

  const publicacionesFiltradas =
    useMemo(
      () =>
        searchItems(
          publicaciones,
          busqueda,
          'publicaciones_titulo',
          'publicaciones_descripcion'
        ),
      [
        publicaciones,
        busqueda,
      ]
    );

  const eventosFiltrados =
    useMemo(
      () =>
        searchItems(
          eventos,
          busqueda,
          'evento_titulo',
          'evento_descripcion'
        ),
      [
        eventos,
        busqueda,
      ]
    );

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString)
      return 'Fecha no disponible';

    const date =
      new Date(
        dateString
      );

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return 'Fecha inválida';
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

        <div className="flex-1 flex items-center justify-center p-6">
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
              className="px-8 py-3 rounded-full text-white font-semibold"
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
<br />
        <section
          className="relative overflow-hidden py-24"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="relative max-w-7xl mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-xl flex items-center justify-center">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>

              <div>
                <h1 className="text-5xl lg:text-7xl font-bold text-white font-serif">
                  Instituto de Investigación
                </h1>

                <p className="text-white/80 text-lg mt-2">
                  {
                    institucion?.institucion_nombre
                  }
                </p>
              </div>
            </div>

            {/* SEARCH */}

            <div className="relative max-w-2xl mt-10">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

              <input
                type="text"
                placeholder="Buscar proyectos, publicaciones o eventos..."
                value={
                  busqueda
                }
                onChange={(
                  e
                ) =>
                  setBusqueda(
                    sanitizeText(
                      e.target.value,
                      100
                    )
                  )
                }
                className="w-full pl-14 pr-14 py-5 rounded-2xl bg-white/95 text-gray-900 outline-none shadow-2xl"
              />

              {busqueda && (
                <button
                  onClick={() =>
                    setBusqueda(
                      ''
                    )
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* TABS */}

        <section className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap gap-3">
            {[
              {
                id: 'proyectos',
                label:
                  'Proyectos',
                icon:
                  FlaskConical,
              },

              {
                id: 'publicaciones',
                label:
                  'Publicaciones',
                icon:
                  BookOpen,
              },

              {
                id: 'eventos',
                label:
                  'Eventos',
                icon:
                  Calendar,
              },
            ].map(
              (
                tab
              ) => (
                <button
                  key={
                    tab.id
                  }
                  onClick={() =>
                    setActiveTab(
                      tab.id as any
                    )
                  }
                  className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
                    activeTab ===
                    tab.id
                      ? 'text-white shadow-xl'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={
                    activeTab ===
                    tab.id
                      ? {
                          background:
                            primaryColor,
                        }
                      : {}
                  }
                >
                  <tab.icon className="w-4 h-4" />

                  {
                    tab.label
                  }
                </button>
              )
            )}
          </div>
        </section>

        {/* CONTENT */}

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            {/* PROYECTOS */}

{activeTab === 'eventos' && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
    
    {/* EVENTOS */}
    
    <div className="xl:col-span-2 space-y-8">
      {eventosFiltrados.length > 0 ? (
        eventosFiltrados.map((evento) => (
          <Link
            key={evento.evento_id}
            href={`/institutoInvestigacion/eventos/${evento.evento_id}`}
          >
            <div className="bg-white rounded-3xl border shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
              
              <div className="flex flex-col lg:flex-row">
                
                {evento.evento_imagen && (
                  <div className="relative w-full lg:w-80 h-72 shrink-0">
                    <Image
                      src={getStorageUrl(
                        evento.evento_imagen
                      )}
                      alt={evento.evento_titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 p-8">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    {evento.evento_titulo}
                  </h3>

                  {evento.evento_descripcion && (
                    <div
                      className="text-gray-600 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHTML(
                          evento.evento_descripcion
                        ),
                      }}
                    />
                  )}

                  <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-500">
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />

                      {formatDate(
                        evento.evento_fecha
                      )}
                    </div>

                    {evento.evento_hora && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />

                        {evento.evento_hora}
                      </div>
                    )}

                    {evento.evento_lugar && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />

                        {evento.evento_lugar}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="bg-white rounded-3xl border p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />

          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            No hay eventos
          </h3>

          <p className="text-gray-500">
            No se encontraron eventos del instituto.
          </p>
        </div>
      )}
    </div>

    {/* CALENDARIO */}

    <div className="xl:sticky xl:top-32">
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        
        <div
          className="px-6 py-5 border-b text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />

            <h3 className="text-lg font-semibold">
              Calendario de Eventos
            </h3>
          </div>
        </div>

        <div className="p-4">
          <CalendarWidget
            eventos={eventosFiltrados}
          />
        </div>
      </div>
    </div>
  </div>
)}

            {/* PUBLICACIONES */}

            {activeTab ===
              'publicaciones' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publicacionesFiltradas.map(
                  (
                    publi
                  ) => (
                    <Link
                      key={
                        publi.publicaciones_id
                      }
                      href={`/institutoInvestigacion/publicaciones/${publi.publicaciones_id}`}
                    >
                      <div className="bg-white rounded-3xl border shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full hover:-translate-y-2">
                        {publi.publicaciones_imagen ? (
                          <div className="relative h-56">
                            <Image
                              src={getStorageUrl(
                                publi.publicaciones_imagen
                              )}
                              alt={
                                publi.publicaciones_titulo
                              }
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="h-56 flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                            }}
                          >
                            <BookOpen className="w-16 h-16 text-white/70" />
                          </div>
                        )}

                        <div className="p-8">
                          <h3 className="text-xl font-bold mb-4 text-gray-900 line-clamp-2">
                            {
                              publi.publicaciones_titulo
                            }
                          </h3>

                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />

                            {formatDate(
                              publi.publicaciones_fecha
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}

            {/* EVENTOS */}

            {activeTab ===
              'eventos' && (
              <div className="space-y-8">
                {eventosFiltrados.map(
                  (
                    evento
                  ) => (
                    <Link
                      key={
                        evento.evento_id
                      }
                      href={`/institutoInvestigacion/eventos/${evento.evento_id}`}
                    >
                      <div className="bg-white rounded-3xl border shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
                        <div className="flex flex-col lg:flex-row">
                          {evento.evento_imagen && (
                            <div className="relative w-full lg:w-80 h-72">
                              <Image
                                src={getStorageUrl(
                                  evento.evento_imagen
                                )}
                                alt={
                                  evento.evento_titulo
                                }
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 p-8">
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">
                              {
                                evento.evento_titulo
                              }
                            </h3>

                            {evento.evento_descripcion && (
                              <div
                                className="text-gray-600 line-clamp-3"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    sanitizeHTML(
                                      evento.evento_descripcion
                                    ),
                                }}
                              />
                            )}

                            <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />

                                {formatDate(
                                  evento.evento_fecha
                                )}
                              </div>

                              {evento.evento_hora && (
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4" />

                                  {
                                    evento.evento_hora
                                  }
                                </div>
                              )}

                              {evento.evento_lugar && (
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4" />

                                  {
                                    evento.evento_lugar
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function InstitutoInvestigacionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <InstitutoInvestigacionContent />
    </Suspense>
  );
}