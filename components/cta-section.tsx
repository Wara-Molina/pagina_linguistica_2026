"use client";

import {
  motion,
  useInView,
} from "framer-motion";

import {
  useRef,
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";

import {
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
} from "@/lib/sanitize";

import {
  getStorageUrl,
  getSafeColor,
} from "@/lib/utils";

export function CTASection() {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const { institucion } =
    useInstitucion();

  /*
   * CURSOS API
   */

  const cursos =
    institucion?.cursos || [];

  const [activeCourse, setActiveCourse] =
    useState(0);

  /*
   * ROTACIÓN
   */

  useEffect(() => {
    if (cursos.length <= 1) {
      return;
    }

    const interval =
      setInterval(() => {
        setActiveCourse(
          (prev) =>
            (prev + 1) %
            cursos.length
        );
      }, 6000);

    return () =>
      clearInterval(interval);
  }, [cursos]);

  /*
   * CURSO ACTUAL
   */

  const currentCourse =
    cursos[
      Math.min(
        activeCourse,
        Math.max(
          cursos.length - 1,
          0
        )
      )
    ];

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
   * IMAGEN SEGURA
   */

  const safeImage =
    useMemo(() => {
      const image =
        currentCourse?.det_img_portada;

      if (
        !image ||
        typeof image !==
          "string"
      ) {
        return "/placeholder-course.jpg";
      }

      return getStorageUrl(
        image
      );
    }, [currentCourse]);

  /*
   * TEXTO SEGURO
   */

  const safeTitle =
    sanitizeText(
      currentCourse?.det_titulo ||
        "",
      250
    );

  const safeType =
    sanitizeText(
      currentCourse
        ?.tipo_curso_otro
        ?.tipo_conv_curso_nombre ||
        "",
      120
    );

  const safeDescription =
    sanitizeText(
      currentCourse?.det_descripcion ||
        "",
      600
    );

  return (
    <section
      ref={ref}
      id="cursos"
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
            text-white
            leading-none
          "
        >
          λ
        </div>

        <div
          className="
            absolute
            bottom-10
            right-10
            font-serif
            text-[15rem]
            font-bold
            text-white
            leading-none
          "
        >
          Ω
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
        <div
          className="
            max-w-7xl
            mx-auto
          "
        >
          <div
            className="
              grid
              lg:grid-cols-2
              gap-16
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
                  backdrop-blur-md
                  uppercase
                  tracking-[0.25em]
                  text-xs
                  font-semibold
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
                <GraduationCap className="w-4 h-4" />

                Cursos Académicos
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
                Oferta Académica
              </h2>

              {/* DESCRIPTION */}

              <p
                className="
                  text-lg
                  leading-relaxed
                  mb-10
                  max-w-2xl
                "
                style={{
                  color:
                    "rgba(255,255,255,0.75)",
                }}
              >
                Explora nuestros cursos y programas académicos
                especializados en formación lingüística,
                idiomas e investigación profesional.
              </p>

              {/* TYPE */}

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-5
                  py-3
                  rounded-2xl
                  mb-8
                  text-sm
                  font-semibold
                "
                style={{
                  background:
                    "rgba(255,255,255,0.08)",

                  color:
                    "rgba(255,255,255,0.92)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Sparkles className="w-4 h-4" />

                {safeType ||
                  "Curso"}
              </div>

              {/* COURSE TITLE */}

              <motion.h3
                key={safeTitle}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="
                  font-serif
                  text-3xl
                  md:text-4xl
                  font-semibold
                  leading-snug
                  mb-6
                  text-white
                "
              >
                {safeTitle ||
                  "Curso Académico"}
              </motion.h3>

              {/* DESCRIPTION */}

              {safeDescription && (
                <motion.p
                  key={`${safeTitle}-description`}
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.5,
                  }}
                  className="
                    leading-relaxed
                    text-base
                    mb-10
                    whitespace-pre-line
                  "
                  style={{
                    color:
                      "rgba(255,255,255,0.72)",
                  }}
                >
                  {
                    safeDescription
                  }
                </motion.p>
              )}

              {/* BUTTONS */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-4
                "
              >
                <Button
                  size="lg"
                  className="
                    text-white
                    px-8
                    group
                    shadow-2xl
                    transition-all
                    duration-300
                    hover:scale-[1.02]
                    border-0
                  "
                  style={{
                    backgroundColor:
                      secondaryColor,
                  }}
                >
                  Ver Curso

                  <ArrowRight
                    className="
                      w-4
                      h-4
                      ml-2
                      group-hover:translate-x-1
                      transition-transform
                    "
                  />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="
                    backdrop-blur-md
                    transition-all
                    duration-300
                    border
                    text-white
                    hover:bg-white/10
                  "
                  style={{
                    borderColor:
                      "rgba(255,255,255,0.18)",

                    background:
                      "rgba(255,255,255,0.04)",
                  }}
                >
                  Más Información
                </Button>
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
              className="relative"
            >
              <motion.div
                key={safeImage}
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.6,
                }}
                className="
                  relative
                  aspect-[4/5]
                  rounded-[2rem]
                  overflow-hidden
                  shadow-2xl
                  border
                  backdrop-blur-xl
                "
                style={{
                  borderColor:
                    "rgba(255,255,255,0.10)",

                  background:
                    "rgba(255,255,255,0.04)",
                }}
              >
                {/* IMAGE */}

                <Image
                  src={safeImage}
                  alt={
                    safeTitle ||
                    "Curso académico"
                  }
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                  className="
                    object-cover
                  "
                />

                {/* OVERLAY */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black/90
                    via-black/20
                    to-transparent
                  "
                />

                {/* CONTENT */}

                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    p-10
                  "
                >
                  <div
                    className="
                      backdrop-blur-xl
                      rounded-3xl
                      p-8
                      border
                    "
                    style={{
                      background:
                        "rgba(255,255,255,0.08)",

                      borderColor:
                        "rgba(255,255,255,0.12)",
                    }}
                  >
                    <p
                      className="
                        text-white/70
                        text-sm
                        uppercase
                        tracking-[0.2em]
                        mb-4
                      "
                    >
                      Curso Destacado
                    </p>

                    <h3
                      className="
                        font-serif
                        text-3xl
                        font-semibold
                        text-white
                        leading-tight
                      "
                    >
                      {safeTitle}
                    </h3>
                  </div>
                </div>
              </motion.div>

              {/* INDICATORS */}

              {cursos.length > 1 && (
                <div
                  className="
                    flex
                    justify-center
                    gap-3
                    mt-8
                  "
                >
                  {cursos.map(
                    (
                      _,
                      index
                    ) => (
                      <button
                        key={`course-indicator-${index}`}
                        type="button"
                        onClick={() =>
                          setActiveCourse(
                            index
                          )
                        }
                        className="
                          w-3
                          h-3
                          rounded-full
                          transition-all
                          duration-300
                        "
                        style={{
                          backgroundColor:
                            activeCourse ===
                            index
                              ? secondaryColor
                              : "rgba(255,255,255,0.25)",
                        }}
                        aria-label={`Curso ${index + 1}`}
                      />
                    )
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}