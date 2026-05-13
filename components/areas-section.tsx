"use client";

import {
  motion,
  useInView,
} from "framer-motion";

import { useRef } from "react";

import {
  BookOpen,
  Brain,
  Globe,
  MessageCircle,
  Mic,
  Users,
} from "lucide-react";

import { useLanguage } from "@/lib/language-context";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
} from "@/lib/sanitize";

import {
  getSafeColor,
} from "@/lib/utils";

/*
 * ICONOS
 */

const icons = [
  Mic,
  BookOpen,
  MessageCircle,
  Globe,
  Brain,
  Users,
];

export function AreasSection() {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const { t } =
    useLanguage();

  const { institucion } =
    useInstitucion();

  /*
   * COLORES API
   */

  const colors =
    institucion
      ?.colorinstitucion?.[0];

  const primaryColor =
    getSafeColor(
      colors?.color_primario,
      "#0f172a"
    );

  const secondaryColor =
    getSafeColor(
      colors?.color_secundario,
      "#2563eb"
    );

  /*
   * TEXTO SEGURO
   */

  const safeLabel =
    sanitizeText(
      t.areas.label ||
        "Áreas de Estudio",
      80
    );

  const safeTitle =
    sanitizeText(
      t.areas.title ||
        "Explorando las Dimensiones del Lenguaje",
      150
    );

  const safeDescription =
    sanitizeText(
      t.areas.description ||
        "Sumérgete en las diversas ramas de la lingüística y descubre cómo cada una revela aspectos únicos del lenguaje humano.",
      400
    );

  return (
    <section
      ref={ref}
      id="areas"
      className="
        py-32
        relative
        overflow-hidden
      "
      style={{
        background: `
          linear-gradient(
            135deg,
            ${primaryColor},
            #111827
          )
        `,
      }}
    >
      {/* Decoración */}
      <div
        className="
          absolute
          inset-0
          opacity-5
          pointer-events-none
          select-none
        "
      >
        <div
          className="
            absolute
            top-10
            left-10
            font-serif
            text-[15rem]
            font-bold
            leading-none
            text-white
          "
        >
          α
        </div>

        <div
          className="
            absolute
            bottom-10
            right-10
            font-serif
            text-[15rem]
            font-bold
            leading-none
            text-white
          "
        >
          ω
        </div>
      </div>

      {/* Glow */}
      <div
        className="
          absolute
          top-0
          right-0
          w-[500px]
          h-[500px]
          rounded-full
          blur-3xl
          opacity-20
        "
        style={{
          background:
            secondaryColor,
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
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
            duration: 0.8,
          }}
          className="
            text-center
            max-w-4xl
            mx-auto
            mb-20
          "
        >
          {/* LABEL */}
          <span
            className="
              inline-block
              px-5
              py-2
              rounded-full
              border
              backdrop-blur-md
              font-medium
              tracking-[0.25em]
              uppercase
              text-xs
              mb-6
              text-white
            "
            style={{
              borderColor:
                "rgba(255,255,255,0.15)",

              backgroundColor:
                "rgba(255,255,255,0.08)",
            }}
          >
            {safeLabel}
          </span>

          {/* TITLE */}
          <h2
            className="
              font-serif
              text-4xl
              md:text-5xl
              lg:text-6xl
              font-light
              mb-8
              leading-tight
              text-white
            "
          >
            {safeTitle}
          </h2>

          {/* DESCRIPTION */}
          <p
            className="
              text-lg
              md:text-xl
              leading-relaxed
              max-w-3xl
              mx-auto
            "
            style={{
              color:
                "rgba(255,255,255,0.78)",
            }}
          >
            {
              safeDescription
            }
          </p>
        </motion.div>

        {/* GRID */}
        <div
          className="
            grid
            md:grid-cols-2
            lg:grid-cols-3
            gap-8
          "
        >
          {(
            t.areas.items || []
          ).map(
            (
              area,
              index
            ) => {
              const IconComponent =
                icons[
                  index %
                    icons.length
                ];

              /*
               * TEXTO SEGURO
               */

              const safeAreaTitle =
                sanitizeText(
                  area.title ||
                    "Área",
                  120
                );

              const safeAreaDescription =
                sanitizeText(
                  area.description ||
                    "",
                  350
                );

              return (
                <motion.div
                  key={`${safeAreaTitle}-${index}`}
                  initial={{
                    opacity: 0,
                    y: 30,
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
                      0.1 *
                      index,
                  }}
                  className="
                    group
                    relative
                    overflow-hidden
                    p-8
                    rounded-3xl
                    backdrop-blur-xl
                    border
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-2xl
                  "
                  style={{
                    background:
                      "rgba(255,255,255,0.06)",

                    borderColor:
                      "rgba(255,255,255,0.10)",
                  }}
                >
                  {/* Glow hover */}
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
                          rgba(255,255,255,0.08),
                          transparent
                        )
                      `,
                    }}
                  />

                  {/* Icon */}
                  <div
                    className="
                      relative
                      w-14
                      h-14
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      mb-6
                      group-hover:scale-110
                      transition-transform
                    "
                    style={{
                      background:
                        "rgba(255,255,255,0.08)",
                    }}
                  >
                    <IconComponent
                      className="w-7 h-7 text-white"
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="
                      relative
                      font-serif
                      text-2xl
                      font-medium
                      mb-4
                      leading-snug
                      text-white
                    "
                  >
                    {
                      safeAreaTitle
                    }
                  </h3>

                  {/* Description */}
                  <p
                    className="
                      relative
                      leading-relaxed
                    "
                    style={{
                      color:
                        "rgba(255,255,255,0.75)",
                    }}
                  >
                    {
                      safeAreaDescription
                    }
                  </p>
                </motion.div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}