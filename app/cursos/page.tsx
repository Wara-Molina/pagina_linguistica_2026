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
  Clock,
  Users,
  BookOpen,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  GraduationCap,
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

import CalendarWidget from '@/components/CalendarWidget';

// ================= TYPES =================

interface Curso {
  iddetalle_cursos_academicos: number;

  det_img_portada?: string;

  det_titulo: string;

  det_descripcion?: string;

  det_costo: number;

  det_cupo_max: number;

  det_carga_horaria?: number;

  det_modalidad: string;

  det_fecha_ini?: string;

  det_fecha_fin?: string;

  det_estado: string;

  tipo_curso_otro?: {
    tipo_conv_curso_nombre: string;
  };
}

interface Evento {
  evento_id: number;

  evento_titulo: string;

  evento_fecha: string;

  evento_hora?: string;

  evento_lugar?: string;

  evento_estado?: string;
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

// ================= HELPERS =================

const searchCursos = (
  cursos: Curso[],
  query: string
): Curso[] => {
  if (
    !query.trim()
  ) {
    return cursos;
  }

  const safeQuery =
    sanitizeQueryParam(
      query
    ).toLowerCase();

  return cursos.filter(
    (
      curso
    ) =>
      curso.det_titulo
        ?.toLowerCase()
        .includes(
          safeQuery
        ) ||
      curso.det_descripcion
        ?.toLowerCase()
        .includes(
          safeQuery
        )
  );
};

// ================= COMPONENT =================

function CursosContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const currentPage =
    Number(
      searchParams.get(
        'pagina'
      )
    ) || 1;

  const itemsPerPage = 6;

  const [tipoActivo, setTipoActivo] =
    useState(
      sanitizeQueryParam(
        searchParams.get(
          'tipo'
        ) || 'TODOS'
      )
    );

  const [busqueda, setBusqueda] =
    useState('');

  const [searchFocused, setSearchFocused] =
    useState(false);

  const [cursos, setCursos] =
    useState<
      Curso[]
    >([]);

  const [eventos, setEventos] =
    useState<
      Evento[]
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
    useState<
      string | null
    >(null);

  const [tipos, setTipos] =
    useState<
      string[]
    >([]);

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

  // ================= FETCH =================

  useEffect(() => {
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

          const cursosData =
            gacetaRes.data
              ?.cursos?.filter(
                (
                  c: any
                ) =>
                  c.det_estado ===
                  '1'
              ) || [];

          const eventosData =
            gacetaRes.data
              ?.upea_evento?.filter(
                (
                  e: any
                ) =>
                  e.evento_estado ===
                  '1'
              ) || [];

          setCursos(
            cursosData
          );

          setEventos(
            eventosData
          );

          setInstitucion(
            instRes.data
              ?.Descripcion ||
              null
          );

          const tiposSet =
            new Set<
              string
            >();

          cursosData.forEach(
            (
              curso: Curso
            ) => {
              const tipo =
                curso
                  .tipo_curso_otro
                  ?.tipo_conv_curso_nombre;

              if (
                tipo
              ) {
                tiposSet.add(
                  tipo.toUpperCase()
                );
              }
            }
          );

          setTipos(
            Array.from(
              tiposSet
            )
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
            'No se pudieron cargar los cursos'
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchData();
  }, []);

  // ================= FILTER =================

  const cursosFiltrados =
    useMemo(() => {
      let filtrados =
        cursos;

      if (
        tipoActivo !==
        'TODOS'
      ) {
        filtrados =
          filtrados.filter(
            (
              curso
            ) =>
              curso
                .tipo_curso_otro
                ?.tipo_conv_curso_nombre?.toUpperCase() ===
              tipoActivo
          );
      }

      return searchCursos(
        filtrados,
        busqueda
      );
    }, [
      cursos,
      tipoActivo,
      busqueda,
    ]);

  // ================= PAGINATION =================

  const totalPages =
    Math.ceil(
      cursosFiltrados.length /
        itemsPerPage
    );

  const safePage =
    Math.min(
      Math.max(
        currentPage,
        1
      ),
      totalPages ||
        1
    );

  const start =
    (safePage -
      1) *
    itemsPerPage;

  const cursosPage =
    cursosFiltrados.slice(
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

    router.push(
      `/cursos?${params.toString()}`
    );

    window.scrollTo(
      {
        top: 0,
        behavior:
          'smooth',
      }
    );
  };

  // ================= FILTER URL =================

  useEffect(() => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    if (
      tipoActivo !==
      'TODOS'
    ) {
      params.set(
        'tipo',
        tipoActivo
      );
    } else {
      params.delete(
        'tipo'
      );
    }

    router.replace(
      `/cursos?${params.toString()}`,
      {
        scroll:
          false,
      }
    );
  }, [
    tipoActivo,
  ]);

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

  // ================= ERROR =================

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              
            </div>

            <h1 className="text-4xl font-bold mb-4">
              Error
            </h1>

            <p className="text-gray-600 mb-10">
              {error}
            </p>

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

  // ================= RENDER =================

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
<br /><br />
        <section
          className="relative overflow-hidden py-24"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)]" />

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>

              <div>
                <p className="text-white/70 uppercase tracking-[0.3em] text-sm font-semibold mb-2">
                  Formación
                  académica
                </p>

                <h1 className="text-5xl md:text-7xl font-bold text-white font-serif leading-none">
                  Cursos
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-lg md:text-xl text-white/80 leading-relaxed">
              Explora la
              oferta académica
              de{' '}
              <span className="font-semibold text-white">
                {sanitizeText(
                  institucion?.institucion_nombre ||
                    'UPEA',
                  120
                )}
              </span>
            </p>

            {/* SEARCH */}

            <div className="mt-12 max-w-2xl">
              <div
                className={`relative rounded-3xl overflow-hidden border transition-all ${
                  searchFocused
                    ? 'ring-4 ring-white/20'
                    : ''
                }`}
                style={{
                  borderColor:
                    'rgba(255,255,255,0.15)',
                }}
              >
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />

                <input
                  type="text"
                  value={
                    busqueda
                  }
                  onChange={(
                    e
                  ) =>
                    setBusqueda(
                      sanitizeText(
                        e.target
                          .value,
                        100
                      )
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
                  placeholder="Buscar cursos..."
                  className="w-full bg-white/95 backdrop-blur-xl pl-16 pr-16 py-5 text-lg text-gray-900 placeholder-gray-500 outline-none"
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

              <p className="mt-4 text-white/70 text-sm">
                {
                  cursosFiltrados.length
                }{' '}
                cursos
                encontrados
              </p>
            </div>
          </div>
        </section>

        {/* FILTERS */}

        <section className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setTipoActivo(
                    'TODOS'
                  )
                }
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  tipoActivo ===
                  'TODOS'
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={
                  tipoActivo ===
                  'TODOS'
                    ? {
                        background:
                          primaryColor,
                      }
                    : {}
                }
              >
                Todos
              </button>

              {tipos.map(
                (
                  tipo
                ) => (
                  <button
                    key={
                      tipo
                    }
                    onClick={() =>
                      setTipoActivo(
                        tipo
                      )
                    }
                    className={`px-6 py-3 rounded-full font-semibold transition-all ${
                      tipoActivo ===
                      tipo
                        ? 'text-white shadow-lg scale-105'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={
                      tipoActivo ===
                      tipo
                        ? {
                            background:
                              secondaryColor,
                          }
                        : {}
                    }
                  >
                    {tipo}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* COURSES */}

              <div className="lg:col-span-2">
                {cursosPage.length ===
                0 ? (
                  <div className="bg-white rounded-[32px] border shadow-sm p-16 text-center">
                    <BookOpen className="w-20 h-20 mx-auto mb-8 text-gray-300" />

                    <h2 className="text-3xl font-bold mb-4">
                      Sin
                      resultados
                    </h2>

                    <p className="text-gray-600">
                      No se
                      encontraron
                      cursos
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-8">
                      {cursosPage.map(
                        (
                          curso
                        ) => {
                          const imageUrl =
                            curso.det_img_portada
                              ? getStorageUrl(
                                  curso.det_img_portada
                                )
                              : '';

                          const safeImage =
                            isSafeImageUrl(
                              imageUrl
                            );

                          return (
                            <Link
                              key={
                                curso.iddetalle_cursos_academicos
                              }
                              href={`/cursos/${curso.iddetalle_cursos_academicos}`}
                              className="group"
                            >
                              <article className="bg-white rounded-[32px] border shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                                {/* IMAGE */}

                                <div className="relative h-64 overflow-hidden">
                                  {safeImage ? (
                                    <Image
                                      src={
                                        imageUrl
                                      }
                                      alt={sanitizeText(
                                        curso.det_titulo,
                                        120
                                      )}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full flex items-center justify-center"
                                      style={{
                                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                                      }}
                                    >
                                      <BookOpen className="w-20 h-20 text-white/40" />
                                    </div>
                                  )}

                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                  <div className="absolute bottom-5 left-5">
                                    <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest">
                                      {sanitizeText(
                                        curso
                                          .tipo_curso_otro
                                          ?.tipo_conv_curso_nombre ||
                                          'Curso',
                                        50
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* BODY */}

                                <div className="p-8">
                                  <h2 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2">
                                    {sanitizeText(
                                      curso.det_titulo,
                                      120
                                    )}
                                  </h2>

                                  {curso.det_descripcion && (
                                    <div
                                      className="text-gray-600 line-clamp-3 mb-8 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          sanitizeHTML(
                                            curso.det_descripcion
                                          ),
                                      }}
                                    />
                                  )}

                                  {/* META */}

                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-gray-600">
                                      <Clock className="w-5 h-5" />

                                      <span>
                                        {curso.det_carga_horaria ||
                                          'Por definir'}{' '}
                                        horas
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-600">
                                      <Users className="w-5 h-5" />

                                      <span>
                                        {
                                          curso.det_cupo_max
                                        }{' '}
                                        cupos
                                      </span>
                                    </div>

                                    {curso.det_costo >
                                      0 && (
                                      <div
                                        className="text-xl font-bold"
                                        style={{
                                          color:
                                            primaryColor,
                                        }}
                                      >
                                        Bs.{' '}
                                        {
                                          curso.det_costo
                                        }
                                      </div>
                                    )}
                                  </div>

                                  {/* FOOTER */}

                                  <div className="mt-8 pt-6 border-t flex items-center justify-between">
                                    <span
                                      className="font-semibold"
                                      style={{
                                        color:
                                          primaryColor,
                                      }}
                                    >
                                      Ver
                                      detalles
                                    </span>

                                    <ArrowRight
                                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                                      style={{
                                        color:
                                          primaryColor,
                                      }}
                                    />
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
                      <div className="flex justify-center items-center gap-3 mt-16">
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
                          ) => (
                            <button
                              key={
                                i
                              }
                              onClick={() =>
                                changePage(
                                  i +
                                    1
                                )
                              }
                              className={`w-12 h-12 rounded-2xl font-bold transition-all ${
                                safePage ===
                                i +
                                  1
                                  ? 'text-white scale-110 shadow-lg'
                                  : 'bg-white border'
                              }`}
                              style={
                                safePage ===
                                i +
                                  1
                                  ? {
                                      background:
                                        primaryColor,
                                    }
                                  : {}
                              }
                            >
                              {i +
                                1}
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

                <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
                  <div
                    className="px-6 py-5 border-b"
                    style={{
                      background: `${hexToRgba(primaryColor, 0.06)}`,
                    }}
                  >
                    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900">
                      <CalendarDays
                        className="w-6 h-6"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />

                      Calendario
                    </h3>
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
                        eventos
                      }
                    />
                  </div>
                </div>

                {/* EVENTS */}

                {eventos.length >
                  0 && (
                  <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
                    <div
                      className="px-6 py-5 border-b"
                      style={{
                        background: `${hexToRgba(secondaryColor, 0.06)}`,
                      }}
                    >
                      <h3 className="text-xl font-bold text-gray-900">
                        Próximos
                        eventos
                      </h3>
                    </div>

                    <div className="p-6 space-y-5">
                      {eventos
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            evento
                          ) => (
                            <div
                              key={
                                evento.evento_id
                              }
                              className="border rounded-2xl p-5 hover:shadow-md transition-all"
                            >
                              <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">
                                {sanitizeText(
                                  evento.evento_titulo,
                                  100
                                )}
                              </h4>

                              <div className="text-sm text-gray-600">
                                {new Date(
                                  evento.evento_fecha
                                ).toLocaleDateString(
                                  'es-BO'
                                )}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ================= PAGE =================

export default function CursosPage() {
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
      <CursosContent />
    </Suspense>
  );
}