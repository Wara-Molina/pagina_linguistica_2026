"use client";

import Link from "next/link";

import Image from "next/image";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  ChevronDown,
  GraduationCap,
  Globe,
  BookOpen,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
} from "@/lib/sanitize";

import {
  getStorageUrl,
  getSafeColor,
} from "@/lib/utils";

interface PortadaItem {
  portada_id?: number;

  portada_imagen?: string;

  portada_titulo?: string;

  portada_subtitulo?: string;
}

export function HeroSection() {
  const {
    institucion,
  } = useInstitucion();

  /*
   * PORTADAS API
   */

  const portadas =
    useMemo(() => {
      const data =
        institucion?.portada;

      if (
        !Array.isArray(data)
      ) {
        return [];
      }

      return data.filter(
        (
          item: PortadaItem
        ) =>
          !!item?.portada_imagen
      );
    }, [
      institucion?.portada,
    ]);

  /*
   * SLIDER
   */

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  useEffect(() => {
    if (
      portadas.length <= 1
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        setCurrentIndex(
          (prev) =>
            (prev + 1) %
            portadas.length
        );
      }, 6000);

    return () =>
      clearInterval(interval);
  }, [portadas.length]);

  /*
   * PORTADA ACTUAL
   */

  const portadaActual =
    portadas[
      currentIndex
    ] || null;

  /*
   * COLORES
   */

  const primaryColor =
    getSafeColor(
      institucion
        ?.colorinstitucion?.[0]
        ?.color_primario,
      "#04246C"
    );

  const secondaryColor =
    getSafeColor(
      institucion
        ?.colorinstitucion?.[0]
        ?.color_secundario,
      "#8B5CF6"
    );

  /*
   * IMAGEN SEGURA
   */

  const bannerImage =
    portadaActual
      ?.portada_imagen
      ? getStorageUrl(
          portadaActual.portada_imagen
        )
      : "/images/upea-noche.jpg";

  /*
   * TEXOS
   */

  const institutionName =
    sanitizeText(
      institucion?.institucion_nombre ||
        portadaActual?.portada_titulo ||
        "Lingüística e Idiomas",
      120
    );

  const institutionInitials =
    sanitizeText(
      institucion?.institucion_iniciales ||
        "LINIDI",
      20
    );

  const subtitle =
    sanitizeText(
      portadaActual?.portada_subtitulo ||
        "Excelencia académica, investigación y formación profesional.",
      180
    );

  return (
    <section
      className="
        relative
        min-h-screen
        flex
        items-center
        justify-center
        overflow-hidden
      "
    >
      {/* BACKGROUND SLIDER */}

      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={bannerImage}
            initial={{
              opacity: 0,
              scale: 1.08,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 1.02,
            }}
            transition={{
              duration: 1.2,
            }}
            className="absolute inset-0"
          >
            <Image
              src={bannerImage}
              alt="Banner institucional"
              fill
              priority
              unoptimized
              sizes="100vw"
              className="
                object-cover
                brightness-[0.65]
              "
            />
          </motion.div>
        </AnimatePresence>

        {/* OVERLAY */}

        <div className="absolute inset-0 bg-black/60" />

        {/* GRADIENT */}

        <div
          className="
            absolute
            inset-0
          "
          style={{
            background: `
              linear-gradient(
                to top,
                rgba(0,0,0,0.85),
                rgba(0,0,0,0.25),
                rgba(0,0,0,0.55)
              )
            `,
          }}
        />
      </div>

      {/* DECORATION */}

      <motion.div
        className="
          absolute
          top-16
          left-10
          w-80
          h-80
          rounded-full
          blur-3xl
          opacity-30
        "
        style={{
          background:
            primaryColor,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [
            0.18,
            0.35,
            0.18,
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="
          absolute
          bottom-0
          right-0
          w-[28rem]
          h-[28rem]
          rounded-full
          blur-3xl
          opacity-20
        "
        style={{
          background:
            secondaryColor,
        }}
        animate={{
          scale: [
            1.1,
            1,
            1.1,
          ],
          opacity: [
            0.12,
            0.3,
            0.12,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
      />

      {/* CONTENT */}

      <div className="container mx-auto px-6 relative z-10 pt-24">
        <div className="max-w-7xl mx-auto text-center">
          

          {/* TITLE */}

          <AnimatePresence mode="wait">
            <motion.div
              key={
                institutionName
              }
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
              }}
              transition={{
                duration: 0.8,
              }}
              className="mb-10"
            >
              <h1
                className="
                  text-white
                  font-serif
                  font-bold
                  leading-[1.05]
                  tracking-tight
                  drop-shadow-[0_10px_40px_rgba(0,0,0,0.90)]
                  text-4xl
                  sm:text-5xl
                  md:text-6xl
                  lg:text-7xl
                  xl:text-[5.8rem]
                  max-w-6xl
                  mx-auto
                "
              >
                {
                  institutionName
                }
              </h1>
            </motion.div>
          </AnimatePresence>

          {/* FEATURES */}

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
              duration: 0.8,
              delay: 0.3,
            }}
            className="
              flex
              flex-wrap
              justify-center
              gap-5
              mb-14
            "
          >
            {[
              {
                icon:
                  BookOpen,

                text:
                  "Excelencia Académica",
              },

              {
                icon:
                  Globe,

                text:
                  "Investigación y Cultura",
              },

              {
                icon:
                  GraduationCap,

                text:
                  "Formación Profesional",
              },
            ].map(
              (
                item,
                index
              ) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={
                      index
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      px-5
                      py-4
                      rounded-2xl
                      backdrop-blur-xl
                      border
                    "
                    style={{
                      background:
                        "rgba(255,255,255,0.08)",

                      borderColor:
                        "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />

                    <span className="text-white/90 text-sm md:text-base font-medium">
                      {
                        item.text
                      }
                    </span>
                  </div>
                );
              }
            )}
          </motion.div>

          {/* BUTTON */}

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
              duration: 0.8,
              delay: 0.5,
            }}
            className="flex justify-center"
          >
            <Link
              href="/informacion"
            >
              <Button
                size="lg"
                className="
                  text-white
                  px-12
                  py-7
                  text-lg
                  font-semibold
                  rounded-2xl
                  shadow-[0_15px_60px_rgba(0,0,0,0.45)]
                  border-0
                  transition-all
                  duration-300
                  hover:scale-[1.04]
                "
                style={{
                  background: `
                    linear-gradient(
                      135deg,
                      ${primaryColor},
                      ${secondaryColor}
                    )
                  `,
                }}
              >
                Conocer más
              </Button>
            </Link>
          </motion.div>

          {/* INDICADORES */}

          {portadas.length >
            1 && (
            <div
              className="
                flex
                justify-center
                gap-3
                mt-12
              "
            >
              {portadas.map(
                (
                  _,
                  index
                ) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Banner ${index + 1}`}
                    onClick={() =>
                      setCurrentIndex(
                        index
                      )
                    }
                    className={`
                      transition-all
                      duration-300
                      rounded-full
                      ${
                        currentIndex ===
                        index
                          ? "w-10 h-3"
                          : "w-3 h-3"
                      }
                    `}
                    style={{
                      backgroundColor:
                        currentIndex ===
                        index
                          ? secondaryColor
                          : "rgba(255,255,255,0.35)",
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* SCROLL */}

      <motion.div
        className="
          absolute
          bottom-8
          left-1/2
          -translate-x-1/2
        "
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <ChevronDown className="w-7 h-7 text-white/70" />
      </motion.div>
    </section>
  );
}