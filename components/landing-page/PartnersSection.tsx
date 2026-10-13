import Image from "next/image";
import { Container, Eyebrow } from "./primitives";

type Logo = { name: string; src: string };

// Logos in /logos/partners are trimmed to their artwork with transparent backgrounds, so they size consistently
const TRAINING_PARTNERS: Logo[] = [
  { name: "Regent Business School", src: "/logos/partners/regent.png" },
  { name: "Richfield", src: "/logos/partners/richfield.png" },
  { name: "Melsoft Academy", src: "/logos/partners/melsoft.png" },
  { name: "Umuzi", src: "/logos/partners/umuzi.png" },
  { name: "Code Girls Academy", src: "/logos/partners/codegirls.png" },
  { name: "Capacitia", src: "/logos/partners/capacitia.png" },
];

const HIRING_PARTNERS: Logo[] = [
  { name: "Checkers", src: "/logos/partners/checkers.png" },
  { name: "Trenchless Technologies", src: "/logos/partners/trenchless.png" },
  { name: "Idilli", src: "/idili.avif" },
];

function LogoGroup({ label, logos }: { label: string; logos: Logo[] }) {
  return (
    <div className="grid items-center gap-5 xl:grid-cols-[260px_1fr] xl:gap-8">
      <div className="flex justify-center whitespace-nowrap xl:justify-start">
        <Eyebrow>{label}</Eyebrow>
      </div>
      {/* flex rather than grid so a short row (e.g. 3 hiring partners) centres under the label on smaller screens */}
      <ul className="flex flex-wrap justify-center gap-3 sm:gap-4 xl:justify-start">
        {logos.map((logo) => (
          <li
            key={logo.name}
            className="flex h-20 w-[calc((100%-0.75rem)/2)] items-center sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-5rem)/6)] justify-center rounded-2xl bg-white px-5 shadow-[0_1px_2px_rgba(10,27,61,0.06)] ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(10,27,61,0.35)] hover:ring-slate-300 sm:h-24"
          >
            <div className="relative h-9 w-full sm:h-10">
              <Image src={logo.src} alt={logo.name} fill sizes="(max-width: 640px) 40vw, 160px" className="object-contain" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PartnersSection = () => (
  <section aria-label="Partners" className="border-b border-slate-200/70 bg-canvas py-14 sm:py-16">
    <Container className="space-y-10 sm:space-y-12">
      <LogoGroup label="Training and university partners" logos={TRAINING_PARTNERS} />
      <LogoGroup label="Hiring partners" logos={HIRING_PARTNERS} />
    </Container>
  </section>
);
