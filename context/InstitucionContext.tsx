"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import api from "@/lib/axios";

import {
  sanitizeHTML,
  sanitizeText,
  sanitizeExternalUrl,
} from "@/lib/sanitize";

/* =========================
 * TYPES
 * ========================= */

export interface PortadaItem {
  portada_id?: number;

  portada_imagen?: string;

  portada_titulo?: string;

  portada_subtitulo?: string;
}

export interface VideoItem {
  video_id?: number;

  video_enlace?: string;

  video_titulo?: string;

  video_breve_descripcion?: string;

  video_estado?: number;

  video_tipo?: string;
}

export interface AutoridadItem {
  id_autoridad?: number;

  nombre_autoridad?: string;

  cargo_autoridad?: string;

  foto_autoridad?: string;

  facebook_autoridad?: string;

  celular_autoridad?: string;

  twiter_autoridad?: string;
}

export interface PublicacionItem {
  publicaciones_id?: number;

  publicaciones_titulo?: string;

  publicaciones_imagen?: string;

  publicaciones_descripcion?: string;

  publicaciones_fecha?: string;

  publicaciones_autor?: string;

  publicaciones_tipo?: string;
}

export interface LinkItem {
  id_link?: number;

  nombre?: string;

  url_link?: string;

  imagen?: string;

  estado?: number;

  tipo?: string;
}

export interface GacetaItem {
  gaceta_id?: number;

  gaceta_titulo?: string;

  gaceta_documento?: string;

  gaceta_fecha?: string;

  gaceta_tipo?: string;
}

export interface EventoItem {
  evento_id?: number;

  evento_titulo?: string;

  evento_imagen?: string;

  evento_descripcion?: string;

  evento_fecha?: string;

  evento_hora?: string;

  evento_lugar?: string;

  tipo_evento?: string;
}

export interface CursoItem {
  iddetalle_cursos_academicos?: number;

  det_img_portada?: string;

  det_titulo?: string;

  det_descripcion?: string;

  det_modalidad?: string;

  det_fecha_ini?: string;

  det_fecha_fin?: string;

  det_hora_ini?: string;

  det_costo?: number;

  det_cupo_max?: number;

  tipo_curso_otro?: {
    tipo_conv_curso_nombre?: string;
  };
}

export interface ConvocatoriaItem {
  idconvocatorias?: number;

  con_foto_portada?: string;

  con_titulo?: string;

  con_descripcion?: string;

  con_fecha_inicio?: string;

  con_fecha_fin?: string;
}

export interface ServicioItem {
  serv_id?: number;

  serv_imagen?: string;

  serv_nombre?: string;

  serv_descripcion?: string;

  serv_nro_celular?: number;
}

export interface OfertaAcademicaItem {
  ofertas_id?: number;

  ofertas_titulo?: string;

  ofertas_descripcion?: string;

  ofertas_imagen?: string;

  ofertas_inscripciones_ini?: string;

  ofertas_inscripciones_fin?: string;

  ofertas_fecha_examen?: string;
}

export interface UbicacionItem {
  id_ubicacion?: number;

  ubicacion_imagen?: string;

  ubicacion_titulo?: string;

  ubicacion_descripcion?: string;

  ubicacion_latitud?: string;

  ubicacion_longitud?: string;

  ubicacion_estado?: string;
}

export interface ColorInstitucion {
  id_color?: number;

  color_primario?: string;

  color_secundario?: string;

  color_terciario?: string;
}

export interface InstitucionData {
  institucion_id?: number;

  institucion_nombre?: string;

  institucion_iniciales?: string;

  institucion_logo?: string;

  institucion_historia?: string;

  institucion_mision?: string;

  institucion_vision?: string;

  institucion_objetivos?: string;

  institucion_sobre_ins?: string;

  institucion_perfil_profesional?: string;

  institucion_facebook?: string;

  institucion_youtube?: string;

  institucion_twitter?: string;

  institucion_direccion?: string;

  institucion_correo1?: string;

  institucion_correo2?: string;

  institucion_telefono1?: number;

  institucion_telefono2?: number;

  institucion_celular1?: number;

  institucion_celular2?: number;

  institucion_api_google_map?: string;

  institucion_link_video_vision?: string;

  colorinstitucion?: ColorInstitucion[];

  portada?: PortadaItem[];

  videos?: VideoItem[];

  autoridad?: AutoridadItem[];

  publicaciones?: PublicacionItem[];

  links?: LinkItem[];

  linksExternoInterno?: LinkItem[];

  gacetas?: GacetaItem[];

  eventos?: EventoItem[];

  cursos?: CursoItem[];

  convocatorias?: ConvocatoriaItem[];

  serviciosCarrera?: ServicioItem[];

  ofertasAcademicas?: OfertaAcademicaItem[];

  ubicacion?: UbicacionItem[];
}

interface InstitucionContextType {
  institucion: InstitucionData | null;

  loading: boolean;

  error: string | null;

  refreshInstitucion: () => Promise<void>;
}

/* =========================
 * CONTEXT
 * ========================= */

const InstitucionContext =
  createContext<
    | InstitucionContextType
    | undefined
  >(undefined);

/* =========================
 * HELPERS
 * ========================= */

const safeArray = <T,>(
  value: unknown
): T[] => {
  return Array.isArray(value)
    ? value
    : [];
};

const safeUrl = (
  url?: string
): string => {
  return (
    sanitizeExternalUrl(
      url
    ) || ""
  );
};

/* =========================
 * PROVIDER
 * ========================= */

export function InstitucionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [institucion, setInstitucion] =
    useState<InstitucionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const institucionId =
    process.env
      .NEXT_PUBLIC_INSTITUCION_ID ||
    "41";

  const fetchInstitucion =
    useCallback(async () => {
      const controller =
        new AbortController();

      try {
        setLoading(true);

        setError(null);

        if (
          process.env
            .NODE_ENV !==
          "production"
        ) {
          //
        }

        const results =
          await Promise.allSettled([
            api.get(
              `/institucionesPrincipal/${institucionId}`,
              {
                signal:
                  controller.signal,
              }
            ),

            api.get(
              `/institucion/${institucionId}/contenido`,
              {
                signal:
                  controller.signal,
              }
            ),

            api.get(
              `/institucion/${institucionId}/recursos`,
              {
                signal:
                  controller.signal,
              }
            ),

            api.get(
              `/institucion/${institucionId}/gacetaEventos`,
              {
                signal:
                  controller.signal,
              }
            ),
          ]);

        const principalRes =
          results[0];

        const contenidoRes =
          results[1];

        const recursosRes =
          results[2];

        const gacetaRes =
          results[3];

        /* =========================
         * VALIDACIÓN PRINCIPAL
         * ========================= */

        if (
          principalRes.status !==
          "fulfilled"
        ) {
          throw new Error(
            "No se pudo cargar la información principal"
          );
        }

        const principal =
          principalRes.value.data;

        if (!principal) {
          throw new Error(
            "Respuesta inválida del servidor"
          );
        }

        const contenido =
          contenidoRes.status ===
          "fulfilled"
            ? contenidoRes.value
                .data
            : {};

        const recursos =
          recursosRes.status ===
          "fulfilled"
            ? recursosRes.value
                .data
            : {};

        const gaceta =
          gacetaRes.status ===
          "fulfilled"
            ? gacetaRes.value
                .data
            : {};

        if (
          gacetaRes.status ===
            "rejected" &&
          process.env
            .NODE_ENV !==
            "production"
        ) {
          console.warn(
            "[gacetaEventos]",
            gacetaRes.reason
          );
        }

        const descripcion =
          principal?.Descripcion ||
          {};

        setInstitucion({
          /* =========================
           * PRINCIPAL
           * ========================= */

          institucion_id:
            descripcion?.institucion_id,

          institucion_nombre:
            sanitizeText(
              descripcion?.institucion_nombre
            ),

          institucion_iniciales:
            sanitizeText(
              descripcion?.institucion_iniciales
            ),

          institucion_logo:
            sanitizeText(
              descripcion?.institucion_logo
            ),

          institucion_historia:
            sanitizeHTML(
              descripcion?.institucion_historia
            ),

          institucion_mision:
            sanitizeHTML(
              descripcion?.institucion_mision
            ),

          institucion_vision:
            sanitizeHTML(
              descripcion?.institucion_vision
            ),

          institucion_objetivos:
            sanitizeHTML(
              descripcion?.institucion_objetivos
            ),

          institucion_sobre_ins:
            sanitizeHTML(
              descripcion?.institucion_sobre_ins
            ),

          institucion_perfil_profesional:
            sanitizeHTML(
              descripcion?.institucion_perfil_profesional
            ),

          institucion_facebook:
            safeUrl(
              descripcion?.institucion_facebook
            ),

          institucion_youtube:
            safeUrl(
              descripcion?.institucion_youtube
            ),

          institucion_twitter:
            safeUrl(
              descripcion?.institucion_twitter
            ),

          institucion_direccion:
            sanitizeText(
              descripcion?.institucion_direccion
            ),

          institucion_correo1:
            sanitizeText(
              descripcion?.institucion_correo1
            ),

          institucion_correo2:
            sanitizeText(
              descripcion?.institucion_correo2
            ),

          institucion_telefono1:
            descripcion?.institucion_telefono1,

          institucion_telefono2:
            descripcion?.institucion_telefono2,

          institucion_celular1:
            descripcion?.institucion_celular1,

          institucion_celular2:
            descripcion?.institucion_celular2,

          institucion_api_google_map:
            safeUrl(
              descripcion?.institucion_api_google_map
            ),

          institucion_link_video_vision:
            safeUrl(
              descripcion?.institucion_link_video_vision
            ),

          colorinstitucion:
            safeArray<ColorInstitucion>(
              descripcion?.colorinstitucion
            ),

          /* =========================
           * CONTENIDO
           * ========================= */

          portada:
            safeArray<PortadaItem>(
              contenido?.portada
            ),

          videos:
            safeArray<VideoItem>(
              contenido?.upea_videos
            ),

          autoridad:
            safeArray<AutoridadItem>(
              contenido?.autoridad
            ),

          ubicacion:
            safeArray<UbicacionItem>(
              contenido?.ubicacion
            ),

          /* =========================
           * RECURSOS
           * ========================= */

          publicaciones:
            safeArray<PublicacionItem>(
              recursos?.upea_publicaciones
            ),

          links:
            safeArray<LinkItem>(
              recursos?.links
            ).filter(
              (item) =>
                !!safeUrl(
                  item?.url_link
                )
            ),

          linksExternoInterno:
            safeArray<LinkItem>(
              recursos?.linksExternoInterno
            ).filter(
              (item) =>
                !!safeUrl(
                  item?.url_link
                )
            ),

          /* =========================
           * GACETA
           * ========================= */

          gacetas:
            safeArray<GacetaItem>(
              gaceta?.upea_gaceta_universitaria
            ),

          eventos:
            safeArray<EventoItem>(
              gaceta?.upea_evento
            ),

          cursos:
            safeArray<CursoItem>(
              gaceta?.cursos
            ),

          convocatorias:
            safeArray<ConvocatoriaItem>(
              gaceta?.convocatorias
            ),

          serviciosCarrera:
            safeArray<ServicioItem>(
              gaceta?.serviciosCarrera
            ),

          ofertasAcademicas:
            safeArray<OfertaAcademicaItem>(
              gaceta?.ofertasAcademicas
            ),
        });
      } catch (err) {
        if (
          process.env
            .NODE_ENV !==
          "production"
        ) {
          console.error(
            "[InstitucionContext]",
            err
          );
        }

        setError(
          err instanceof Error
            ? err.message
            : "Error cargando institución"
        );

        setInstitucion(null);
      } finally {
        setLoading(false);
      }

    }, [institucionId]);

  useEffect(() => {
    fetchInstitucion();
  }, [fetchInstitucion]);

  const value = useMemo(
    () => ({
      institucion,

      loading,

      error,

      refreshInstitucion:
        fetchInstitucion,
    }),

    [
      institucion,
      loading,
      error,
      fetchInstitucion,
    ]
  );

  return (
    <InstitucionContext.Provider
      value={value}
    >
      {children}
    </InstitucionContext.Provider>
  );
}

/* =========================
 * HOOK
 * ========================= */

export function useInstitucion() {
  const context =
    useContext(
      InstitucionContext
    );

  if (!context) {
    throw new Error(
      "useInstitucion must be used within InstitucionProvider"
    );
  }

  return context;
}