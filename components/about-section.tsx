"use client";

import {
  motion,
  useInView,
} from "framer-motion";

import {
  useRef,
  useMemo,
} from "react";

import {
  BookOpen,
  Video,
  Newspaper,
  GraduationCap,
  Sparkles,
  Eye,
} from "lucide-react";

import { useLanguage } from "@/lib/language-context";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
  sanitizeHTML,
} from "@/lib/sanitize";

import {
  getSafeColor,
} from "@/lib/utils";

export function AboutSection() {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const { language } =
    useLanguage();

  const { institucion } =
    useInstitucion();

  /*
   * SANITIZE SEGURO
   */

  const cleanMission =
    useMemo(() => {
      return sanitizeText(
        sanitizeHTML(
          institucion?.institucion_mision ||
            ""
        )
          .replace(
            /&nbsp;/gi,
            " "
          )
          .trim(),
        500
      );
    }, [
      institucion?.institucion_mision,
    ]);

  const cleanVision =
    useMemo(() => {
      return sanitizeText(
        sanitizeHTML(
          institucion?.institucion_vision ||
            ""
        )
          .replace(
            /&nbsp;/gi,
            " "
          )
          .trim(),
        500
      );
    }, [
      institucion?.institucion_vision,
    ]);

  /*
   * COLORES SEGUROS API
   */

  const colors =
    institucion
      ?.colorinstitucion?.[0];

  const primaryColor =
    getSafeColor(
      colors?.color_primario,
      "#8b5e3c"
    );

  const secondaryColor =
    getSafeColor(
      colors?.color_secundario,
      "#6b21a8"
    );

  const tertiaryColor =
    getSafeColor(
      colors?.color_terciario,
      "#111827"
    );

  /*
   * NOMBRE SEGURO
   */

  const institutionName =
    sanitizeText(
      institucion?.institucion_nombre ||
        "Lingüística",
      120
    );

  /*
   * STATS
   */

  const stats = [
    {
      value:
        institucion?.videos
          ?.length || 0,

      label: "Videos",

      icon: Video,
    },

    {
      value:
        institucion?.gacetas
          ?.length || 0,

      label: "Gacetas",

      icon: Newspaper,
    },

    {
      value:
        institucion?.eventos
          ?.length || 0,

      label: "Eventos",

      icon: GraduationCap,
    },

    {
      value:
        institucion?.cursos
          ?.length || 0,

      label: "Cursos",

      icon: BookOpen,
    },
  ];

  return (
    <section
      ref={ref}
      id="programa"
      className="
        relative
        py-32
        overflow-hidden
        bg-white
      "
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <div
          className="
            absolute
            top-0
            left-0
            w-[500px]
            h-[500px]
            rounded-full
            blur-3xl
            opacity-10
          "
          style={{
            background:
              primaryColor,
          }}
        />

        <div
          className="
            absolute
            bottom-0
            right-0
            w-[400px]
            h-[400px]
            rounded-full
            blur-3xl
            opacity-10
          "
          style={{
            background:
              secondaryColor,
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div
          className="
            grid
            lg:grid-cols-2
            gap-20
            items-center
          "
        >
          {/* LEFT */}
          <motion.div
            initial={{
              opacity: 0,
              x: -50,
            }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    x: 0,
                  }
                : {}
            }
            transition={{
              duration: 0.8,
            }}
          >
            {/* TAG */}
            <span
              className="
                inline-flex
                items-center
                gap-2
                px-5
                py-2
                rounded-full
                border
                uppercase
                tracking-[0.25em]
                text-xs
                font-semibold
                mb-6
                backdrop-blur-xl
              "
              style={{
                borderColor:
                  `${primaryColor}30`,

                backgroundColor:
                  `${primaryColor}10`,

                color:
                  primaryColor,
              }}
            >
              <Sparkles className="w-4 h-4" />

              Sobre Nosotros
            </span>

            {/* TITLE */}
            <h2
              className="
                font-serif
                text-4xl
                md:text-5xl
                lg:text-6xl
                italic
                font-semibold
                leading-tight
                mb-10
                break-words
              "
              style={{
                color:
                  tertiaryColor,
              }}
            >
              {
                institutionName
              }
            </h2>

            {/* MISIÓN */}
            <div
              className="
                mb-8
                rounded-3xl
                border
                p-8
                shadow-xl
                backdrop-blur-xl
              "
              style={{
                borderColor:
                  `${primaryColor}10`,

                backgroundColor:
                  "#fafafa",
              }}
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  mb-5
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    text-white
                    shrink-0
                  "
                  style={{
                    background:
                      primaryColor,
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>

                <h3
                  className="
                    font-serif
                    text-2xl
                    font-semibold
                  "
                  style={{
                    color:
                      tertiaryColor,
                  }}
                >
                  Misión
                </h3>
              </div>

              <p
                className="
                  leading-relaxed
                  text-base
                  whitespace-pre-line
                "
                style={{
                  color:
                    "#374151",
                }}
              >
                {cleanMission ||
                  "Formar profesionales con excelencia académica."}
              </p>
            </div>

            {/* VISIÓN */}
            <div
              className="
                rounded-3xl
                border
                p-8
                shadow-xl
                backdrop-blur-xl
              "
              style={{
                borderColor:
                  `${secondaryColor}10`,

                backgroundColor:
                  "#fafafa",
              }}
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  mb-5
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    text-white
                    shrink-0
                  "
                  style={{
                    background:
                      secondaryColor,
                  }}
                >
                  <Eye className="w-5 h-5" />
                </div>

                <h3
                  className="
                    font-serif
                    text-2xl
                    font-semibold
                  "
                  style={{
                    color:
                      tertiaryColor,
                  }}
                >
                  Visión
                </h3>
              </div>

              <p
                className="
                  leading-relaxed
                  text-base
                  whitespace-pre-line
                "
                style={{
                  color:
                    "#374151",
                }}
              >
                {cleanVision ||
                  "Ser referente académico nacional."}
              </p>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    x: 0,
                  }
                : {}
            }
            transition={{
              duration: 0.8,
              delay: 0.2,
            }}
            className="
              grid
              grid-cols-2
              gap-6
            "
          >
            {stats.map(
              (stat, index) => {
                const Icon =
                  stat.icon;

                return (
                  <motion.div
                    key={`${stat.label}-${index}`}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={
                      isInView
                        ? {
                            opacity: 1,
                            y: 0,
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.6,
                      delay:
                        0.3 +
                        index * 0.1,
                    }}
                    className="
                      group
                      relative
                      overflow-hidden
                      rounded-3xl
                      border
                      p-8
                      shadow-xl
                      hover:scale-[1.02]
                      transition-all
                      duration-300
                      backdrop-blur-xl
                    "
                    style={{
                      borderColor:
                        `${primaryColor}10`,

                      backgroundColor:
                        "#fafafa",
                    }}
                  >
                    {/* Glow */}
                    <div
                      className="
                        absolute
                        inset-0
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-300
                      "
                      style={{
                        background: `
                          linear-gradient(
                            135deg,
                            ${primaryColor}10,
                            transparent
                          )
                        `,
                      }}
                    />

                    {/* Icon */}
                    <div
                      className="
                        relative
                        mb-6
                      "
                    >
                      <Icon
                        className="
                          w-10
                          h-10
                        "
                        style={{
                          color:
                            index % 2 ===
                            0
                              ? primaryColor
                              : secondaryColor,
                        }}
                      />
                    </div>

                    {/* VALUE */}
                    <span
                      className="
                        relative
                        block
                        font-serif
                        text-5xl
                        md:text-6xl
                        italic
                        font-semibold
                        mb-3
                      "
                      style={{
                        color:
                          tertiaryColor,
                      }}
                    >
                      {
                        stat.value
                      }
                    </span>

                    {/* LABEL */}
                    <span
                      className="
                        relative
                        text-sm
                        uppercase
                        tracking-[0.25em]
                        font-medium
                      "
                      style={{
                        color:
                          "#374151",
                      }}
                    >
                      {
                        stat.label
                      }
                    </span>
                  </motion.div>
                );
              }
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}