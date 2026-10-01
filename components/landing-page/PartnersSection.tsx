import Image from "next/image";
import { Container } from "./primitives";

const TRAINING_PARTNERS = [
  { name: "Regent Business School", src: "/logos/regent.png" },
  { name: "Richfield", src: "/logos/richfield.png" },
  { name: "Melsoft Academy", src: "/logos/melsoft.png" },
  { name: "Umuzi", src: "/logos/umuzi.png" },
  { name: "Code Girls Academy", src: "/logos/codegirls.png" },
  { name: "Capacitia", src: "/logos/capacita.png" },
];

const HIRING_PARTNERS = [
  { name: "Checkers", src: "/checkers.png" },
  { name: "Trenchless Technologies", src: "/trenchless.png" },
  { name: "Idilli", src: "/idili.avif" },
];

function LogoRow({ label, logos }: { label: string; logos: { name: string; src: string }[] }) {
  return (
    <div>
      <p className="text-center text-[13px] font-medium text-slate-500 lg:text-left">{label}</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 lg:justify-start">
        {logos.map((logo) => (
          <li key={logo.name} className="relative h-10 w-28 sm:w-32">
            {/* multiply blends away the logos' white backgrounds; grayscale keeps the strip calm */}
            <Image
              src={logo.src}
              alt={logo.name}
              fill
              sizes="128px"
              className="object-contain opacity-60 mix-blend-multiply grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PartnersSection = () => (
  <section aria-label="Partners" className="border-b border-slate-200/70 bg-white py-14 sm:py-16">
    <Container>
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <LogoRow label="Training and university partners" logos={TRAINING_PARTNERS} />
        <LogoRow label="Hiring partners" logos={HIRING_PARTNERS} />
      </div>
    </Container>
  </section>
);
