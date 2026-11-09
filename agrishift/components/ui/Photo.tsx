import Image from "next/image";
import type { ReactNode } from "react";
import { IMAGES, type ImageKey } from "@/lib/images";

/** Photo à ses vraies dimensions : la page ne saute pas quand elle arrive. */
export function Photo({
  image,
  sizes,
  className = "",
  priority = false,
  decorative = false,
}: {
  image: ImageKey;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** true si le texte voisin dit déjà ce que montre la photo. */
  decorative?: boolean;
}) {
  const img = IMAGES[image];
  return (
    <Image
      src={img.src}
      width={img.width}
      height={img.height}
      alt={decorative ? "" : img.alt}
      sizes={sizes}
      priority={priority}
      className={`photo object-cover ${className}`}
    />
  );
}

/** Bandeau photo avec titre, pour le haut des écrans. */
export function PhotoHeader({
  image,
  title,
  subtitle,
  children,
  priority = true,
}: {
  image: ImageKey;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  priority?: boolean;
}) {
  return (
    <header className="relative isolate -mx-4 -mt-4 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-box">
      <Photo
        image={image}
        sizes="(max-width: 640px) 100vw, 640px"
        priority={priority}
        decorative
        className="absolute inset-0 -z-20 h-full w-full"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/40 to-black/10" />
      <div className="flex min-h-40 flex-col justify-end px-4 pt-10 pb-4 text-white">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-1 text-lg">{subtitle}</p> : null}
        {children}
      </div>
    </header>
  );
}

/** Rond photo d'une culture. */
export function CropPhoto({ cropId, size = 56, className = "" }: { cropId: string; size?: number; className?: string }) {
  const known = cropId in IMAGES;
  if (!known) return null;
  return (
    <Image
      src={IMAGES[cropId as ImageKey].src}
      width={size * 2}
      height={size * 2}
      alt=""
      style={{ width: size, height: size }}
      className={`photo rounded-full object-cover ${className}`}
    />
  );
}
