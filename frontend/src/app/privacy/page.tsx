import Link from 'next/link';

const sections = [
  { id: 'information', label: 'Information we handle' },
  { id: 'linkedin', label: 'LinkedIn connection' },
  { id: 'use', label: 'How we use information' },
  { id: 'storage', label: 'Storage and security' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'retention', label: 'Retention and deletion' },
  { id: 'cookies', label: 'Browser storage' },
  { id: 'contact', label: 'Contact' },
];

function PolicySection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/10 py-9 sm:py-11">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
      <div className="max-w-3xl space-y-4 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl py-8 sm:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-slate-900/70 px-6 py-9 shadow-2xl shadow-black/20 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-300"
          >
            <span aria-hidden="true">←</span> Back to SkillDNA AI
          </Link>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Your data, clearly explained
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            This page describes information SkillDNA AI handles when you use the service, including
            when you connect a LinkedIn account.
          </p>
          <p className="mt-5 text-xs text-slate-500">Last updated: November 4, 2026</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/50 p-5 lg:sticky lg:top-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            On this page
          </p>
          <nav
            aria-label="Privacy policy sections"
            className="flex flex-wrap gap-x-4 gap-y-3 lg:flex-col lg:gap-3"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-slate-400 transition hover:text-emerald-300"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="rounded-2xl border border-white/10 bg-slate-900/40 px-6 sm:px-9">
          <div className="py-8 text-sm leading-7 text-slate-300">
            <p>
              SkillDNA AI helps you organize a technical profile, connect supported services, and
              create profile insights. The sections below summarize the information visible in the
              current product and code. Your use of a connected service is also subject to that
              service’s own terms and privacy notice.
            </p>
          </div>

          <PolicySection id="information" eyebrow="01 / Information" title="Information we handle">
            <p>
              When you create and use an account, SkillDNA AI handles account details such as your
              name, email address, and password, along with profile information you provide. The
              product also stores profile and career details you add, such as a headline, biography,
              location, target role, experience, availability, skills, and project information.
            </p>
            <p>
              If you connect an external platform, we handle the account identifier and profile
              information returned through that connection, along with connection status and
              synchronization details. The precise fields depend on the platform and what its API
              makes available.
            </p>
            <p>
              When you request an AI generated profile report, the service builds a report context
              from your account email, profile and career details, skills, projects, and
              connected-platform information. That context is sent to the configured Google Gemini
              service to generate the report.
            </p>
          </PolicySection>

          <PolicySection
            id="linkedin"
            eyebrow="02 / LinkedIn"
            title="LinkedIn connection and permissions"
          >
            <p>
              Connecting LinkedIn is optional. SkillDNA AI requests the LinkedIn OpenID Connect
              permissions{' '}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">openid</code>,{' '}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">profile</code>,
              and <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">email</code>
              . LinkedIn displays its authorization screen so you can review and approve the
              requested access.
            </p>
            <p>
              After authorization, the app receives an access token and may receive a refresh token.
              It uses the access token to call LinkedIn’s user information endpoint. The information
              handled by the current integration includes your LinkedIn subject identifier, name,
              email, profile picture, locale, and available profile details such as headline and
              country. A LinkedIn profile URL and synchronization metadata are also recorded.
            </p>
            <p>
              LinkedIn tokens are handled by the backend and are not placed in the browser URL or
              the app’s local browser storage. You can disconnect LinkedIn from the Integrations
              page; the current disconnect action marks the connection as disconnected and clears
              its stored access and refresh tokens. It does not remove the other SkillDNA profile or
              account information.
            </p>
          </PolicySection>

          <PolicySection id="use" eyebrow="03 / Use" title="How we use information">
            <p>
              Information is used to operate the account and features you request, including to:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>authenticate you and maintain your signed-in session;</li>
              <li>show and update your technical profile and connected accounts;</li>
              <li>
                retrieve and synchronize profile information from platforms you choose to connect;
                and
              </li>
              <li>prepare the context for AI generated profile insights when you request them.</li>
            </ul>
          </PolicySection>

          <PolicySection id="storage" eyebrow="04 / Safeguards" title="Storage and security">
            <p>
              Account, profile, integration, and report information is handled by the application
              backend and database. The backend encrypts LinkedIn access and refresh tokens before
              saving them in the integration record. Sign-in access and refresh tokens are stored in
              your browser’s local storage by the web app.
            </p>
            <p>
              These are implementation details, not a guarantee that every part of the service or
              its hosting environment is encrypted or secure in every circumstance. No online
              service can be described as completely secure.
            </p>
          </PolicySection>

          <PolicySection id="sharing" eyebrow="05 / External services" title="Sharing">
            <p>
              When you authorize a LinkedIn connection, SkillDNA AI exchanges authorization
              information with LinkedIn and requests the profile data described above from
              LinkedIn’s API. When you request an AI report, the report context is sent to Google
              Gemini for generation.
            </p>
            <p>
              The current source code does not establish a complete list of production hosting,
              database, monitoring, or other service providers, or the terms under which they may
              process information. This policy does not make claims about those providers.
            </p>
          </PolicySection>

          <PolicySection id="retention" eyebrow="06 / Your choices" title="Retention and deletion">
            <p>
              The application stores account and profile records and keeps integration records after
              a platform is disconnected; disconnecting clears that integration’s tokens but does
              not itself erase its remaining record or synced profile data. The code does not
              specify a general retention period or provide a complete self-service account deletion
              flow.
            </p>
            <p>
              For a request to access, correct, or delete information, contact the SkillDNA AI team
              using the privacy contact listed below. The team will need to confirm how identity is
              verified, what records can be removed, and whether any records must be retained.
            </p>
          </PolicySection>

          <PolicySection id="cookies" eyebrow="07 / Browser" title="Cookies and local storage">
            <p>
              The web app stores sign-in access and refresh tokens in browser local storage so it
              can keep you signed in and make authenticated requests. The reviewed application code
              does not show an analytics or advertising tracker. This statement does not cover
              cookies or tools that may be added by production hosting or other services outside the
              reviewed app code.
            </p>
          </PolicySection>

          <PolicySection id="contact" eyebrow="08 / Contact" title="Privacy questions">
            <p>
              For privacy questions or data requests, contact:{' '}
              <a
                className="font-medium text-amber-200 underline underline-offset-4 hover:text-amber-100"
                href="mailto:ksparu12@gmail.com"
              >
                ksparu12@gmail.com
              </a>
              .
            </p>
          </PolicySection>

          <div className="border-t border-white/10 py-6 text-xs leading-6 text-slate-500">
            This policy describes the application behavior reviewed for this page. Review it against
            the live service configuration and your actual operating practices before publication.
          </div>
        </article>
      </div>
    </div>
  );
}
