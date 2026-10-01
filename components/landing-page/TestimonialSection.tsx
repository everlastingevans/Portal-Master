import Image from "next/image";
import avatar from "@/assets/avatar-thomas.jpg";
import GraduatesImage from "@/assets/models/models2.jpg";
import { Reveal } from "./Reveal";
import { Container } from "./primitives";

export const TestimonialSection = () => (
  <section className="bg-white py-24 md:py-32">
    <Container>
      <Reveal>
        <figure className="grid overflow-hidden rounded-[32px] border border-slate-200/80 bg-canvas lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-10 p-8 sm:p-12 lg:col-span-7 lg:p-16">
            <svg viewBox="0 0 48 36" className="h-9 w-12 text-brand-lime" fill="currentColor" aria-hidden>
              <path d="M0 36V22.2C0 9.6 6.6 2.2 19.8 0l1.9 4.9C14.6 6.9 11 10.9 10.8 17H20v19H0Zm27.6 0V22.2C27.6 9.6 34.2 2.2 47.4 0l.6 4.9c-7.1 2-10.7 6-10.9 12.1h9.2v19H27.6Z" />
            </svg>
            <blockquote className="text-[22px] font-medium leading-[1.45] tracking-tight text-brand-navy sm:text-[26px]">
              We hired three graduates through LaunchPath in under six weeks. The matching was sharp, the screening saved us hours, and every single one is still with us a year
              later. It’s the best hiring decision we’ve made as a small team.
            </blockquote>
            <figcaption className="flex items-center gap-4">
              <Image src={avatar} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover ring-4 ring-white" />
              <div>
                <p className="text-[16px] font-semibold text-brand-navy">Mark Veld</p>
                <p className="text-sm text-slate-500">Founder, Veld Tech</p>
              </div>
            </figcaption>
          </div>
          <div className="relative min-h-[280px] lg:col-span-5">
            <Image src={GraduatesImage} alt="Graduates celebrating at a graduation ceremony" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
          </div>
        </figure>
      </Reveal>
    </Container>
  </section>
);
