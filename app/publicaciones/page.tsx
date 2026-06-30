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
  BookOpen,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import Link from 'next/link';

import Image from 'next/image';

import api from '@/lib/axios';

import { sanitizeHTML } from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

interface ColorInstitucion {
  color_primario?: string;

  color_secundario?: string;

  color_terciario?: string;
}

interface Publicacion {
  publicaciones_id: number;

  publicaciones_titulo: string;

  publicaciones_imagen?: string;

  publicaciones_descripcion?: string;

  publicaciones_documento?: string;

  publicaciones_fecha: string;

  publicaciones_autor?: string;

  publicaciones_tipo?: string;

  publicaciones_estado?: string;
}

interface InstitucionData {
  institucion_nombre?: string;

  institucion_iniciales?: string;

  colorinstitucion?: ColorInstitucion[];
}

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||'';

const isValidHexColor = (
  color?: string
): boolean => {
  if (!color) return false;

  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    color
  );
};

const getSafeColor = (
  color: string | undefined,
  fallback: string
): string => {
  if (
    color &&
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
  const cleanHex = hex.replace('#', '');

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
    .replace(/[<>\"'&{}]/g, '')
    .trim()
    .slice(0, 200);
};

const getImageUrl = (
  image?: string
): string => {
  if (!image) {
    return '/placeholder.jpg';
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }

  return `${STORAGE_URL}/${image}`;
};

const removeHtml = (
  html?: string
): string => {
  if (!html) return '';

  return sanitizeHTML(html)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const searchPublicaciones = (
  publicaciones: Publicacion[],
  query: string
): Publicacion[] => {
  if (!query.trim()) {
    return publicaciones;
  }

  const safeQuery =
    sanitizeSearchQuery(
      query
    ).toLowerCase();

  return publicaciones.filter(
    (p) =>
      p.publicaciones_titulo
        ?.toLowerCase()
        .includes(safeQuery) ||
      removeHtml(
        p.publicaciones_descripcion
      )
        .toLowerCase()
        .includes(safeQuery) ||
      p.publicaciones_autor
        ?.toLowerCase()
        .includes(safeQuery)
  );
};

function PublicacionesContent() {
  const searchParams =
    useSearchParams();

  const router = useRouter();

  const rawPagina = Number(
    searchParams.get('pagina')
  );

  const paginaActual =
    Number.isInteger(rawPagina) &&
    rawPagina > 0 &&
    rawPagina < 10000
      ? rawPagina
      : 1;

  const itemsPorPagina = 6;

  const [busqueda, setBusqueda] =
    useState('');

  const [
    categoriaActiva,
    setCategoriaActiva,
  ] = useState('TODAS');

  const [searchFocused, setSearchFocused] =
    useState(false);

  const [
    publicaciones,
    setPublicaciones,
  ] = useState<Publicacion[]>([]);

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [categorias, setCategorias] =
    useState<string[]>([]);

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#FC0102');

  const [tertiaryColor, setTertiaryColor] =
    useState('#020733');

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const institucionId =
          Number(
            process.env
              .NEXT_PUBLIC_INSTITUCION_ID
          ) || 41;

        const [
          publiRes,
          instRes,
        ] = await Promise.all([
          api.get(
            `/institucion/${institucionId}/recursos`
          ),

          api.get(
            `/institucionesPrincipal/${institucionId}`
          ),
        ]);

        if (!mounted) return;

        if (
          !Array.isArray(
            publiRes.data
              ?.upea_publicaciones
          )
        ) {
          setPublicaciones([]);

          return;
        }

        const publicacionesData: Publicacion[] =
          publiRes.data.upea_publicaciones.filter(
            (p: Publicacion) =>
              p.publicaciones_estado !==
                '0' &&
              p.publicaciones_tipo !==
                'SEDES'
          );

        setPublicaciones(
          publicacionesData
        );

        setInstitucion(
          instRes.data.Descripcion
        );

        const categoriasUnicas =
          Array.from(
            new Set(
              publicacionesData
                .map(
                  (p) =>
                    p.publicaciones_tipo
                )
                .filter(
                  (
                    tipo
                  ): tipo is string =>
                    Boolean(tipo)
                )
            )
          ).sort();

        setCategorias([
          'TODAS',
          ...categoriasUnicas,
        ]);

        const colors =
          instRes.data?.Descripcion
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
      } catch (error) {
        if (
          process.env.NODE_ENV ===
          'development'
        ) {
          console.error(error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const publicacionesFiltradas =
    useMemo(() => {
      const filtradas =
        categoriaActiva ===
        'TODAS'
          ? publicaciones
          : publicaciones.filter(
              (p) =>
                p.publicaciones_tipo ===
                categoriaActiva
            );

      return searchPublicaciones(
        filtradas,
        busqueda
      );
    }, [
      publicaciones,
      categoriaActiva,
      busqueda,
    ]);

  useEffect(() => {
    if (paginaActual > 1) {
      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      params.set('pagina', '1');

      router.replace(
        `/publicaciones?${params.toString()}`,
        {
          scroll: false,
        }
      );
    }
  }, [
    busqueda,
    categoriaActiva,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      publicacionesFiltradas.length /
        itemsPorPagina
    )
  );

  const inicio =
    (paginaActual - 1) *
    itemsPorPagina;

  const fin = Math.min(
    inicio + itemsPorPagina,
    publicacionesFiltradas.length
  );

  const publicacionesPagina =
    publicacionesFiltradas.slice(
      inicio,
      fin
    );

  const cambiarPagina = (
    nuevaPagina: number
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      'pagina',
      nuevaPagina.toString()
    );

    router.push(
      `/publicaciones?${params.toString()}`
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const formatDate = (
    dateString: string
  ) => {
    try {
      return new Date(
        dateString
      ).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin"
            style={{
              borderColor:
                hexToRgba(
                  primaryColor,
                  0.2
                ),
              borderTopColor:
                primaryColor,
            }}
          />
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
            background: `linear-gradient(135deg, ${primaryColor}, ${tertiaryColor})`,
          }}
        >
          <div className="absolute inset-0 bg-black/30" />

          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />

              Volver al inicio
            </Link>

            <h1
              className="
                font-serif
                text-5xl
                md:text-7xl
                font-light
                tracking-tight
                text-white
                drop-shadow-2xl
                mb-6
              "
            >
              Publicaciones
            </h1>

            <p className="text-white/80 text-lg max-w-2xl leading-relaxed mb-10">
              Artículos,
              investigaciones y
              contenido académico de{' '}
              <span className="font-semibold text-white">
                {institucion?.institucion_nombre ||
                  'la institución'}
              </span>
            </p>

            {/* SEARCH */}
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    sanitizeSearchQuery(
                      e.target.value
                    )
                  )
                }
                onFocus={() =>
                  setSearchFocused(true)
                }
                onBlur={() =>
                  setSearchFocused(false)
                }
                placeholder="Buscar publicaciones..."
                className={`
                  w-full
                  pl-14
                  pr-14
                  py-4
                  rounded-2xl
                  bg-white/95
                  backdrop-blur-xl
                  text-gray-900
                  placeholder:text-gray-500
                  outline-none
                  transition-all
                  border
                  ${
                    searchFocused
                      ? 'border-white shadow-2xl'
                      : 'border-white/20'
                  }
                `}
              />

              {busqueda && (
                <button
                  onClick={() =>
                    setBusqueda('')
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter
                className="w-5 h-5"
                style={{
                  color:
                    primaryColor,
                }}
              />

              {categorias.map(
                (categoria) => (
                  <button
                    key={categoria}
                    onClick={() =>
                      setCategoriaActiva(
                        categoria
                      )
                    }
                    className={`
                    px-5
                    py-2.5
                    rounded-full
                    text-sm
                    font-medium
                    transition-all
                    ${
                      categoriaActiva ===
                      categoria
                        ? 'text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                    style={
                      categoriaActiva ===
                      categoria
                        ? {
                            backgroundColor:
                              primaryColor,
                          }
                        : {}
                    }
                  >
                    {categoria}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

{/* GRID */}
<section className="py-16">
  <div className="max-w-7xl mx-auto px-6">

    {publicacionesPagina.length === 0 ? (
      <div className="flex flex-col items-center justify-center text-center py-24">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{
            backgroundColor: hexToRgba(primaryColor, 0.1),
          }}
        >
          <BookOpen
            className="w-12 h-12"
            style={{ color: primaryColor }}
          />
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Sin publicaciones disponibles
        </h2>

        <p className="text-gray-500 max-w-md mb-6">
          {busqueda || categoriaActiva !== 'TODAS'
            ? 'No se encontraron publicaciones con los filtros seleccionados.'
            : 'Actualmente no existen publicaciones registradas.'}
        </p>

        {(busqueda || categoriaActiva !== 'TODAS') && (
          <button
            onClick={() => {
              setBusqueda('');
              setCategoriaActiva('TODAS');
            }}
            className="px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition-all"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            Mostrar todas las publicaciones
          </button>
        )}
      </div>
    ) : (
      <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publicacionesPagina.map(
            (publicacion) => (
              <Link
                key={
                  publicacion.publicaciones_id
                }
                href={`/publicaciones/${publicacion.publicaciones_id}`}
                className="group"
              >
                <article
                  className="
                    bg-white/95
                    backdrop-blur-xl
                    rounded-3xl
                    overflow-hidden
                    border
                    shadow-xl
                    hover:shadow-2xl
                    transition-all
                    duration-500
                    hover:-translate-y-2
                  "
                  style={{
                    borderColor:
                      hexToRgba(
                        primaryColor,
                        0.15
                      ),
                  }}
                >
                  {/* IMAGE */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={getImageUrl(
                        publicacion.publicaciones_imagen
                      )}
                      alt={sanitizeSearchQuery(
                        publicacion.publicaciones_titulo
                      )}
                      fill
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {publicacion.publicaciones_tipo && (
                      <div className="absolute top-4 left-4">
                        <span
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md"
                          style={{
                            color:
                              primaryColor,
                          }}
                        >
                          {
                            publicacion.publicaciones_tipo
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-7">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-2 mb-4 group-hover:text-blue-900 transition-colors">
                      {sanitizeSearchQuery(
                        publicacion.publicaciones_titulo
                      )}
                    </h2>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-6">
                      {removeHtml(
                        publicacion.publicaciones_descripcion
                      ).slice(
                        0,
                        180
                      )}
                    </p>

                    <div className="space-y-3 border-t pt-5">
                      {publicacion.publicaciones_autor && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User
                            className="w-4 h-4"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />

                          {sanitizeSearchQuery(
                            publicacion.publicaciones_autor
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar
                          className="w-4 h-4"
                          style={{
                            color:
                              primaryColor,
                          }}
                        />

                        {formatDate(
                          publicacion.publicaciones_fecha
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )
          )}
        </div>

        {/* PAGINATION */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-3 mt-14">
            <button
              onClick={() =>
                cambiarPagina(
                  paginaActual - 1
                )
              }
              disabled={
                paginaActual === 1
              }
              className="w-11 h-11 rounded-xl border bg-white shadow-sm flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({
              length:
                totalPaginas,
            })
              .slice(0, 5)
              .map((_, i) => {
                const page =
                  i + 1;

                return (
                  <button
                    key={page}
                    onClick={() =>
                      cambiarPagina(
                        page
                      )
                    }
                    className={`
                      w-11
                      h-11
                      rounded-xl
                      font-semibold
                      transition-all
                      ${
                        paginaActual ===
                        page
                          ? 'text-white shadow-xl scale-110'
                          : 'bg-white border'
                      }
                    `}
                    style={
                      paginaActual ===
                      page
                        ? {
                            backgroundColor:
                              primaryColor,
                          }
                        : {}
                    }
                  >
                    {page}
                  </button>
                );
              })}

            <button
              onClick={() =>
                cambiarPagina(
                  paginaActual + 1
                )
              }
              disabled={
                paginaActual ===
                totalPaginas
              }
              className="w-11 h-11 rounded-xl border bg-white shadow-sm flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
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

export default function PublicacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-gray-300 border-t-blue-900 rounded-full animate-spin" />
        </div>
      }
    >
      <PublicacionesContent />
    </Suspense>
  );
}