'use client';

import {
  useState,
  useEffect,
  useMemo,
} from 'react';

import Link from 'next/link';

import Image from 'next/image';

import {
  motion,
} from 'framer-motion';

import {
  Building2,
  MapPin,
  Phone,
  ArrowLeft,
  Search,
  X,
  GraduationCap,
} from 'lucide-react';

import api from '@/lib/axios';

import {
  getStorageUrl,
} from '@/lib/utils';

import {
  sanitizeHTML,
} from '@/lib/sanitize';

import {
  Navbar,
} from '@/components/navbar';

import {
  Footer,
} from '@/components/footer';

import {
  useLanguage,
} from '@/lib/language-context';

interface Sede {
  sede_id: number;

  sede_nombre: string;

  sede_direccion?: string;

  sede_telefono?: string;

  sede_coordinador?: string;

  sede_imagen?: string;

  estado: string;
}

interface InstitucionData {
  institucion_nombre?: string;

  colorinstitucion?: Array<{
    color_primario?: string;

    color_secundario?: string;

    color_terciario?: string;
  }>;
}

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

const searchSedes = (
  sedes: Sede[],
  query: string
): Sede[] => {
  if (!query.trim()) {
    return sedes;
  }

  const safeQuery =
    query
      .toLowerCase()
      .trim()
      .replace(/[<>{}]/g, '');

  return sedes.filter(
    (sede) => {
      const nombre =
        sede.sede_nombre?.toLowerCase() ||
        '';

      const direccion =
        sede.sede_direccion?.toLowerCase() ||
        '';

      const coordinador =
        sede.sede_coordinador?.toLowerCase() ||
        '';

      return (
        nombre.includes(
          safeQuery
        ) ||
        direccion.includes(
          safeQuery
        ) ||
        coordinador.includes(
          safeQuery
        )
      );
    }
  );
};

export default function SedesPage() {
  const { language } =
    useLanguage();

  const [sedes, setSedes] =
    useState<Sede[]>([]);

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] =
    useState('#FC0102');

  const [
    tertiaryColor,
    setTertiaryColor,
  ] =
    useState('#020733');

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSedes =
      async (): Promise<void> => {
        try {
          setLoading(true);

          const institucionId =
            Number(
              process.env
                .NEXT_PUBLIC_INSTITUCION_ID
            ) || 41;

          const [
            recursosRes,
            instRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/recursos`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (!mounted) {
            return;
          }

          const institucionData =
            instRes.data
              ?.Descripcion;

          setInstitucion(
            institucionData
          );

          const publicaciones =
            recursosRes.data
              ?.upea_publicaciones ||
            [];

          const sedesFiltradas =
            publicaciones.filter(
              (
                pub: any
              ) =>
                pub.publicaciones_tipo ===
                'SEDES'
            );

          const sedesMapeadas =
            sedesFiltradas.map(
              (
                pub: any
              ) => ({
                sede_id:
                  Number(
                    pub.publicaciones_id
                  ) || 0,

                sede_nombre:
                  sanitizeHTML(
                    pub.publicaciones_titulo ||
                      ''
                  )
                    .replace(
                      /<[^>]*>/g,
                      ''
                    )
                    .replace(
                      'Sede Academica de ',
                      ''
                    )
                    .replace(
                      'Sede Academica ',
                      ''
                    ),

                sede_direccion:
                  sanitizeHTML(
                    pub.publicaciones_descripcion ||
                      ''
                  ).replace(
                    /<[^>]*>/g,
                    ''
                  ) ||
                  (
                    language ===
                    'es'
                      ? 'Por definir'
                      : 'Undefined'
                  ),

                sede_telefono:
                  '',

                sede_coordinador:
                  sanitizeHTML(
                    pub.publicaciones_autor ||
                      ''
                  ).replace(
                    /<[^>]*>/g,
                    ''
                  ) ||
                  'Coordinación',

                sede_imagen:
                  pub.publicaciones_imagen,

                estado: '1',
              })
            ) as Sede[];

          const sedesCompletas =
            [
              {
                sede_id: 0,

                sede_nombre:
                  language ===
                  'es'
                    ? 'Sede Central'
                    : 'Main Campus',

                sede_direccion:
                  sanitizeHTML(
                    institucionData?.institucion_direccion ||
                      ''
                  ),

                sede_telefono:
                  institucionData?.institucion_celular1?.toString() ||
                  '',

                sede_coordinador:
                  language ===
                  'es'
                    ? 'Dirección General'
                    : 'General Direction',

                sede_imagen:
                  institucionData?.institucion_logo,

                estado: '1',
              },

              ...sedesMapeadas,
            ];

          setSedes(
            sedesCompletas
          );

          const colors =
            institucionData?.colorinstitucion?.[0];

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
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchSedes();

    return () => {
      mounted = false;
    };
  }, [language]);

  const sedesFiltradas =
    useMemo(() => {
      return searchSedes(
        sedes,
        searchQuery
      );
    }, [
      sedes,
      searchQuery,
    ]);

  const hasResults =
    sedesFiltradas.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-5"
              style={{
                borderColor:
                  `${hexToRgba(primaryColor, 0.15)}`,

                borderTopColor:
                  primaryColor,
              }}
            />

            <p className="text-slate-700 font-medium">
              {language === 'es'
                ? 'Cargando sedes...'
                : 'Loading campuses...'}
            </p>
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
        <section className="relative overflow-hidden pt-40 pb-24">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
          />

          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />

          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />

              {language === 'es'
                ? 'Volver al inicio'
                : 'Back to home'}
            </Link>

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
              }}
              className="max-w-4xl"
            >
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl text-white/90 text-sm tracking-[0.25em] uppercase">
                <Building2 className="w-4 h-4" />

                {language === 'es'
                  ? 'Sedes Académicas'
                  : 'Academic Campuses'}
              </span>

              <h1 className="mt-8 font-serif text-5xl md:text-7xl font-semibold text-white leading-tight">
                {language === 'es'
                  ? 'Nuestras Sedes'
                  : 'Our Campuses'}
              </h1>

              <p className="mt-8 text-white/80 text-lg md:text-xl leading-relaxed max-w-3xl">
                {language === 'es'
                  ? 'Encuentra la sede más cercana y descubre todos nuestros espacios académicos.'
                  : 'Find the nearest campus and discover all our academic spaces.'}
              </p>

              {/* SEARCH */}
              <div className="relative max-w-2xl mt-12">
                <div
                  className={`
                  relative
                  transition-all
                  duration-300
                  ${
                    searchFocused
                      ? 'scale-[1.01]'
                      : ''
                  }
                  `}
                >
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                  <input
                    type="text"
                    placeholder={
                      language ===
                      'es'
                        ? 'Buscar sedes...'
                        : 'Search campuses...'
                    }
                    value={
                      searchQuery
                    }
                    onChange={(
                      e
                    ) =>
                      setSearchQuery(
                        e.target.value
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
                    className="
                    w-full
                    pl-14
                    pr-14
                    py-5
                    rounded-2xl
                    bg-white/95
                    backdrop-blur-xl
                    text-slate-900
                    placeholder:text-slate-500
                    focus:outline-none
                    focus:ring-2
                    text-base
                    shadow-2xl
                    "
                  />

                  {searchQuery && (
                    <button
                      onClick={() =>
                        setSearchQuery(
                          ''
                        )
                      }
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="mt-4 text-white/80 text-sm">
                  {hasResults
                    ? `${sedesFiltradas.length} ${
                        language ===
                        'es'
                          ? 'resultado(s)'
                          : 'result(s)'
                      }`
                    : language ===
                      'es'
                    ? 'Sin resultados'
                    : 'No results'}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* GRID */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            {!hasResults ? (
              <div className="text-center py-24">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-8">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>

                <h3 className="font-serif text-3xl font-semibold text-slate-900 mb-3">
                  {language ===
                  'es'
                    ? 'No se encontraron sedes'
                    : 'No campuses found'}
                </h3>

                <p className="text-slate-600 mb-8">
                  {language ===
                  'es'
                    ? 'Prueba con otra búsqueda.'
                    : 'Try another search.'}
                </p>

                <button
                  onClick={() =>
                    setSearchQuery(
                      ''
                    )
                  }
                  className="px-8 py-4 rounded-2xl text-white font-semibold"
                  style={{
                    background:
                      primaryColor,
                  }}
                >
                  {language ===
                  'es'
                    ? 'Limpiar búsqueda'
                    : 'Clear search'}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sedesFiltradas.map(
                  (
                    sede,
                    index
                  ) => (
                    <motion.div
                      key={
                        sede.sede_id
                      }
                      initial={{
                        opacity: 0,
                        y: 30,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.5,
                        delay:
                          index *
                          0.08,
                      }}
                    >
                      <Link
                        href={`/sedes/${sede.sede_id}`}
                        className="group block h-full"
                      >
                        <div
                          className="
                          bg-white/95
                          backdrop-blur-xl
                          rounded-[2rem]
                          overflow-hidden
                          border
                          shadow-[0_15px_50px_rgba(0,0,0,0.08)]
                          hover:shadow-[0_25px_70px_rgba(0,0,0,0.16)]
                          transition-all
                          duration-500
                          hover:-translate-y-3
                          h-full
                          "
                          style={{
                            borderColor:
                              `${hexToRgba(primaryColor, 0.12)}`,
                          }}
                        >
                          {/* IMAGE */}
                          <div className="relative h-64 overflow-hidden">
                            {sede.sede_imagen ? (
                              <Image
                                src={getStorageUrl(
                                  sede.sede_imagen
                                )}
                                alt={
                                  sede.sede_nombre
                                }
                                fill
                                sizes="(max-width:768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                }}
                              >
                                <Building2 className="w-20 h-20 text-white/60" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                            {sede.sede_id ===
                              0 && (
                              <div className="absolute top-5 left-5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl text-sm font-semibold shadow-lg">
                                <span className="flex items-center gap-2">
                                  <GraduationCap
                                    className="w-4 h-4"
                                    style={{
                                      color:
                                        primaryColor,
                                    }}
                                  />

                                  {language ===
                                  'es'
                                    ? 'Principal'
                                    : 'Main'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* CONTENT */}
                          <div className="p-8">
                            <h3
                              className="
                              font-serif
                              text-3xl
                              font-semibold
                              leading-tight
                              mb-5
                              "
                              style={{
                                color:
                                  primaryColor,
                              }}
                            >
                              {
                                sede.sede_nombre
                              }
                            </h3>

                            <div className="space-y-4 text-slate-600">
                              {sede.sede_direccion && (
                                <div className="flex items-start gap-3">
                                  <MapPin
                                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                                    style={{
                                      color:
                                        secondaryColor,
                                    }}
                                  />

                                  <span className="line-clamp-3">
                                    {
                                      sede.sede_direccion
                                    }
                                  </span>
                                </div>
                              )}

                              {sede.sede_telefono && (
                                <div className="flex items-center gap-3">
                                  <Phone
                                    className="w-5 h-5"
                                    style={{
                                      color:
                                        secondaryColor,
                                    }}
                                  />

                                  <span>
                                    {
                                      sede.sede_telefono
                                    }
                                  </span>
                                </div>
                              )}
                            </div>

                            <div
                              className="mt-8 pt-6 border-t flex items-center justify-between"
                              style={{
                                borderColor:
                                  `${hexToRgba(primaryColor, 0.12)}`,
                              }}
                            >
                              <span
                                className="font-semibold"
                                style={{
                                  color:
                                    primaryColor,
                                }}
                              >
                                {language ===
                                'es'
                                  ? 'Ver detalles'
                                  : 'View details'}
                              </span>

                              <ArrowLeft
                                className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform"
                                style={{
                                  color:
                                    primaryColor,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-24"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.08)}, ${hexToRgba(secondaryColor, 0.08)})`,
          }}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2
              className="font-serif text-4xl md:text-5xl font-semibold mb-6"
              style={{
                color:
                  primaryColor,
              }}
            >
              {language ===
              'es'
                ? '¿Necesitas más información?'
                : 'Need more information?'}
            </h2>

            <p className="text-slate-600 text-lg mb-10">
              {language ===
              'es'
                ? 'Contáctanos y descubre todo sobre nuestras sedes académicas.'
                : 'Contact us and discover more about our academic campuses.'}
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-semibold shadow-xl hover:scale-105 transition-all"
              style={{
                background:
                  primaryColor,
              }}
            >
              {language ===
              'es'
                ? 'Ir al inicio'
                : 'Go home'}

              <ArrowLeft className="w-5 h-5 rotate-180" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}