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
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

import Image from "next/image";

import { useLanguage } from "@/lib/language-context";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
  sanitizeExternalUrl,
} from "@/lib/sanitize";

import {
  getStorageUrl,
  getSafeColor,
} from "@/lib/utils";

export function TestimonialsSection() {
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
   * AUTORIDADES API
   */

  const autoridades =
    institucion?.autoridad || [];

  /*
   * COLOR INSTITUCIONAL
   */

  const primaryColor =
    getSafeColor(
      institucion
        ?.colorinstitucion?.[0]
        ?.color_primario,
      "#8b5e3c"
    );

  /*
   * AUTORIDADES SEGURAS
   */

  const safeAuthorities =
    useMemo(() => {
      return autoridades.map(
        (
          item,
          index
        ) => {
          const rawImage =
            item?.foto_autoridad;

          /*
           * URL SEGURA
           */

          const imageUrl =
            rawImage
              ? getStorageUrl(
                  rawImage
                )
              : "/placeholder-user.jpg";

          const safeImage =
            sanitizeExternalUrl(
              imageUrl
            ) ||
            "/placeholder-user.jpg";

          return {
            id:
              item?.id_autoridad ||
              `authority-${index}`,

            name:
              sanitizeText(
                item?.nombre_autoridad ||
                  "Autoridad",
                150
              ),

            role:
              sanitizeText(
                item?.cargo_autoridad ||
                  "Cargo institucional",
                200
              ),

            image:
              safeImage,
          };
        }
      );
    }, [autoridades]);

  return (
    <section
      ref={ref}
      id="autoridades"
      className="
        py-32
        relative
        overflow-hidden
      "
      style={{
        background: `
          linear-gradient(
            135deg,
            ${primaryColor}15 0%,
            #ffffff 40%,
            #f8fafc 100%
          )
        `,
      }}
    >
      {/* Decorative Glow */}
      <div
        className="
          absolute
          top-0
          left-0
          w-[500px]
          h-[500px]
          rounded-full
          blur-3xl
          opacity-20
        "
        style={{
          background:
            primaryColor,
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
            max-w-3xl
            mx-auto
            mb-20
          "
        >
          <span
            className="
              inline-flex
              items-center
              gap-2
              px-5
              py-2
              rounded-full
              bg-white/70
              backdrop-blur-xl
              uppercase
              tracking-[0.25em]
              text-xs
              font-semibold
              mb-6
              shadow-sm
              border
            "
            style={{
              borderColor: `${primaryColor}30`,
              color: primaryColor,
            }}
          >
            <ShieldCheck className="w-4 h-4" />

            {language === "es"
              ? "Autoridades"
              : "Autoridades"}
          </span>

          <h2
            className="
              font-serif
              text-4xl
              md:text-5xl
              lg:text-6xl
              font-light
              mb-6
              text-foreground
              leading-tight
            "
          >
            {language === "es"
              ? "Dirección Institucional"
              : "Dirección Institucional"}
          </h2>

          <p
            className="
              text-muted-foreground
              text-lg
              leading-relaxed
            "
          >
            {language === "es"
              ? "Conoce a las autoridades académicas y administrativas que lideran nuestra institución."
             :"Conoce a las autoridades académicas y administrativas que lideran nuestra institución."}
          </p>
        </motion.div>

        {/* GRID */}
        <div
          className="
            grid
            md:grid-cols-2
            xl:grid-cols-3
            gap-10
            max-w-7xl
            mx-auto
          "
        >
          {safeAuthorities.map(
            (
              authority,
              index
            ) => (
              <motion.div
                key={
                  authority.id
                }
                initial={{
                  opacity: 0,
                  y: 40,
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
                    index * 0.1,
                }}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  bg-white/70
                  backdrop-blur-xl
                  shadow-xl
                  hover:shadow-2xl
                  transition-all
                  duration-500
                "
                style={{
                  borderColor:
                    `${primaryColor}15`,
                }}
              >
                {/* TOP BAR */}
                <div
                  className="h-2 w-full"
                  style={{
                    background:
                      primaryColor,
                  }}
                />

                <div className="p-8">
                  {/* IMAGE */}
                  <div
                    className="
                      relative
                      w-36
                      h-36
                      mx-auto
                      mb-8
                    "
                  >
                    <div
                      className="
                        absolute
                        inset-0
                        rounded-full
                        blur-2xl
                        opacity-20
                      "
                      style={{
                        background:
                          primaryColor,
                      }}
                    />

                    <Image
                      src={
                        authority.image
                      }
                      alt={
                        authority.name
                      }
                      fill
                      sizes="144px"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="
                        rounded-full
                        object-cover
                        border-4
                        border-white
                        shadow-xl
                      "
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="text-center">
                    <h3
                      className="
                        font-serif
                        text-2xl
                        font-semibold
                        text-foreground
                        leading-snug
                        mb-4
                      "
                    >
                      {
                        authority.name
                      }
                    </h3>

                    <div
                      className="
                        inline-flex
                        items-center
                        gap-2
                        px-4
                        py-2
                        rounded-full
                        text-sm
                        font-medium
                        mb-6
                      "
                      style={{
                        background:
                          `${primaryColor}15`,
                        color:
                          primaryColor,
                      }}
                    >
                      <GraduationCap className="w-4 h-4" />

                      {
                        authority.role
                      }
                    </div>

                    <div
                      className="
                        h-px
                        w-16
                        mx-auto
                        opacity-20
                      "
                      style={{
                        background:
                          primaryColor,
                      }}
                    />
                  </div>
                </div>

                {/* Hover Effect */}
                <div
                  className="
                    absolute
                    inset-0
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    duration-500
                    pointer-events-none
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        transparent 60%,
                        ${primaryColor}08 100%
                      )
                    `,
                  }}
                />
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}