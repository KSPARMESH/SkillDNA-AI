import Link from 'next/link';

interface SectionItem {
  id: string;
  number: string;
  label: string;
}

const sections: SectionItem[] = [
  { id: 'overview', number: '01', label: 'Overview & Scope' },
  { id: 'direct-collection', number: '02', label: 'Direct Information' },
  { id: 'github', number: '03', label: 'GitHub Synchronization' },
  { id: 'linkedin', number: '04', label: 'LinkedIn Connection' },
  { id: 'platforms', number: '05', label: 'External Developer APIs' },
  { id: 'ai-processing', number: '06', label: 'AI & Gemini Processing' },
  { id: 'use-of-data', number: '07', label: 'How We Use Data' },
  { id: 'security', number: '08', label: 'Security & Architecture' },
  { id: 'retention-deletion', number: '09', label: 'Retention & Deletion' },
  { id: 'browser-storage', number: '10', label: 'Browser Storage & Cookies' },
  { id: 'user-rights', number: '11', label: 'Your Rights & Choices' },
  { id: 'contact', number: '12', label: 'Contact & Inquiries' },
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
      <h2 className="mb-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
      <div className="max-w-3xl space-y-4 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl py-8 sm:py-14">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-slate-900/70 px-6 py-9 shadow-2xl shadow-black/20 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
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
              YOUR DATA, CLEARLY EXPLAINED
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-100 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            This Privacy Policy details how SkillDNA AI handles user accounts, profile metrics,
            third-party developer platform synchronizations (including GitHub and LinkedIn), and
            artificial intelligence evaluations across our platform.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1 font-medium">
              Effective Date: November 5, 2026
            </span>
            <span className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 font-medium text-emerald-300">
              Architecture Verified
            </span>
            <span className="rounded-md border border-amber-900/60 bg-amber-950/40 px-3 py-1 font-medium text-amber-300">
              Legal Entity Pending
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        {/* Sticky Table of Contents Sidebar */}
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/50 p-5 lg:sticky lg:top-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Table of Contents
          </p>
          <nav
            aria-label="Privacy policy section navigation"
            className="flex flex-wrap gap-x-4 gap-y-2.5 lg:flex-col lg:gap-2"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="group flex items-center gap-2 text-xs text-slate-400 transition hover:text-emerald-300"
              >
                <span className="font-mono text-[11px] text-slate-600 transition group-hover:text-emerald-400">
                  {section.number}
                </span>
                <span className="leading-snug">{section.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Policy Body */}
        <article className="rounded-2xl border border-white/10 bg-slate-900/40 px-6 sm:px-9">
          <div className="py-8 text-sm leading-7 text-slate-300">
            <p>
              SkillDNA AI is a technical identity platform designed to help software professionals
              aggregate, verify, and highlight their continuous engineering journey across code
              repositories, competitive programming platforms, technical publications, and portfolio
              achievements. This policy describes the data we process, the technical protections in
              place, and the operational boundaries of our service.
            </p>
          </div>

          {/* Section 01: Overview & Scope of Service */}
          <PolicySection id="overview" eyebrow="01 / Overview" title="Overview & Scope of Service">
            <p>
              This Privacy Policy applies to personal information collected and processed by{' '}
              <strong className="text-slate-100">Parmesh KS (Individual Project Operator)</strong>{' '}
              (&ldquo;SkillDNA AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              through our web application, application programming interfaces (APIs), and related
              services.
            </p>
            <p>
              Our platform continuously transforms distributed, public software engineering activity
              into a living technical identity. When you connect external platforms or provide
              career information, our systems process that data to compute SkillDNA readiness
              metrics and generate dynamic evaluations.
            </p>
            <p>
              Your interactions with third-party platforms (such as GitHub, LinkedIn, or LeetCode)
              are separately governed by the respective terms of service and privacy policies of
              those independent providers. SkillDNA AI is not responsible for the privacy practices
              of external platforms.
            </p>
          </PolicySection>

          {/* Section 02: Information We Collect Directly */}
          <PolicySection
            id="direct-collection"
            eyebrow="02 / Direct Data"
            title="Information We Collect Directly"
          >
            <p>
              We collect information that you directly provide when registering for an account,
              building your technical profile, or updating your portfolio:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <strong className="text-slate-100">Account Identity:</strong> First name, last name,
                email address, account password (stored securely as a salted hash), and account role
                (e.g., Student, Recruiter, Mentor, University, or Admin).
              </li>
              <li>
                <strong className="text-slate-100">Profile &amp; Career Details:</strong>{' '}
                Professional headline, biography, physical location, personal portfolio URL, target
                engineering role, years of professional experience, expected salary range, and job
                availability status (such as &ldquo;Open to Work&rdquo;).
              </li>
              <li>
                <strong className="text-slate-100">Public Platform Handles:</strong> Self-reported
                public usernames for supported developer services, including GitHub, LeetCode,
                HackerRank, and LinkedIn profile URLs.
              </li>
              <li>
                <strong className="text-slate-100">Technical Skills:</strong> Skills you declare,
                skill categories (such as Languages, Frontend, Backend, AI/ML, DevOps, Database,
                Cloud), self-assessed proficiency tiers (Beginner through Master), self-ratings, and
                years of experience.
              </li>
              <li>
                <strong className="text-slate-100">Projects &amp; Portfolio:</strong> Project
                titles, descriptions, category tags, repository URLs, live deployment links,
                declared tech stacks, and self-reported or synchronized lines of code.
              </li>
              <li>
                <strong className="text-slate-100">Education &amp; Credentials:</strong> Educational
                institutions, degrees, fields of study, start and end years, academic grades,
                verified certifications, issuing authorities, credential identifiers, hackathon
                participations, team roles, and awards.
              </li>
              <li>
                <strong className="text-slate-100">Operational &amp; Audit Logs:</strong> IP
                address, browser User-Agent header, session timestamps, and administrative audit
                events (such as account sign-in, sign-out, and profile modifications).
              </li>
            </ul>
          </PolicySection>

          {/* Section 03: GitHub Integration & Authenticated Synchronization */}
          <PolicySection
            id="github"
            eyebrow="03 / GitHub Integration"
            title="GitHub Integration & Authenticated Synchronization"
          >
            <p>
              SkillDNA AI provides an authenticated GitHub integration utilizing the standard OAuth
              2.0 authorization code flow to verify your developer identity and synchronize public
              technical footprint data.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                Requested GitHub Permissions
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Our OAuth integration requests an{' '}
                <strong className="text-slate-100">empty scope</strong> (
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">
                  scope: &apos;&apos;
                </code>
                ). Under GitHub&apos;s authorization model, this grants strictly read-only access to
                your public user profile and public repositories.
              </p>
            </div>
            <p>
              <strong className="text-slate-100">What we DO NOT access or request:</strong> We do
              not request, ingest, or store private repository code, private repository metadata,
              personal organization administration privileges, pull-request write permissions, or
              code modification rights. We cannot alter your repositories or publish commits on your
              behalf.
            </p>
            <p>
              <strong className="text-slate-100">Data Synchronized from GitHub:</strong> During
              authenticated synchronization, our system calls GitHub&apos;s REST API endpoints to
              retrieve:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                Public username, verified numerical GitHub user ID, avatar URL, bio, and account
                creation date.
              </li>
              <li>
                Public repository statistics: count of public repositories, stargazers received,
                repository forks, and public gist activity.
              </li>
              <li>
                Aggregated programming language distributions computed across your public
                repositories.
              </li>
              <li>
                Repository titles, descriptions, primary language, and public URLs used to populate
                your portfolio projects.
              </li>
            </ul>
            <p>
              <strong className="text-slate-100">Token Protection:</strong> OAuth access tokens and
              refresh tokens received from GitHub are encrypted using AES-256-GCM before being saved
              in our database. Tokens are never returned to the browser client or included in URL
              parameters.
            </p>
            <p>
              <strong className="text-slate-100">Alternative Username Connection:</strong> You may
              also link a public GitHub username without authorizing OAuth. Username-only
              connections ingest the same public metrics via GitHub&apos;s public API but are
              subject to unauthenticated rate limits.
            </p>
          </PolicySection>

          {/* Section 04: LinkedIn Connection & Professional Profile Data */}
          <PolicySection
            id="linkedin"
            eyebrow="04 / LinkedIn Connection"
            title="LinkedIn Connection & Professional Profile Data"
          >
            <p>
              Connecting your LinkedIn account is entirely optional. It allows you to confirm your
              professional credentials and career trajectory on SkillDNA AI.
            </p>
            <p>
              Our LinkedIn integration operates via OpenID Connect (OIDC) and requests three
              specific scopes:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">openid</code>:
                Confirms your unique LinkedIn subject identifier.
              </li>
              <li>
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">profile</code>
                : Retrieves your verified display name, profile picture URL, locale, and available
                headline.
              </li>
              <li>
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">email</code>:
                Retrieves your primary verified LinkedIn email address.
              </li>
            </ul>
            <p>
              LinkedIn credentials are encrypted at rest using AES-256-GCM in the backend. Tokens
              are never exposed to the client application or stored in browser local storage.
              Disconnecting LinkedIn immediately nullifies stored OAuth tokens.
            </p>
          </PolicySection>

          {/* Section 05: Third-Party Developer Platforms & Public APIs */}
          <PolicySection
            id="platforms"
            eyebrow="05 / Platform APIs"
            title="Third-Party Developer Platforms & Public APIs"
          >
            <p>
              In addition to GitHub and LinkedIn, SkillDNA AI integrates with specialized developer
              and competitive programming platforms. All platform connections outside of GitHub and
              LinkedIn OAuth operate
              <strong className="text-slate-100">
                {' '}
                strictly via publicly exposed usernames and public APIs
              </strong>
              :
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <h4 className="font-semibold text-slate-100">LeetCode</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Queries public GraphQL endpoints for problem counts (Easy, Medium, Hard), total
                  solved, and contest rating.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <h4 className="font-semibold text-slate-100">HackerRank</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Fetches verified domain badges, star ratings, and assessment achievements via
                  public profile endpoints.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <h4 className="font-semibold text-slate-100">Codeforces</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Synchronizes competitive programming rank, maximum contest rating, and contest
                  participation history.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <h4 className="font-semibold text-slate-100">Stack Overflow</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Retrieves public reputation scores, bronze/silver/gold badge counts, and top
                  answering tags.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <h4 className="font-semibold text-slate-100">AtCoder &amp; CodeChef</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Retrieves public algorithmic contest performance, star ratings, and global
                  rankings.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <h4 className="font-semibold text-slate-100">Kaggle, Devpost &amp; Medium</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Pulls data science tiers, hackathon project awards, and published engineering
                  article metrics.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Important Privacy Note:</strong> We do not ask for,
              capture, or store passwords or private account sessions for these platforms. We only
              query information that is already publicly visible on the web under your supplied
              username.
            </p>
          </PolicySection>

          {/* Section 06: Artificial Intelligence & Google Gemini Processing */}
          <PolicySection
            id="ai-processing"
            eyebrow="06 / AI Engine"
            title="Artificial Intelligence & Google Gemini Processing"
          >
            <p>
              SkillDNA AI uses artificial intelligence to evaluate technical proficiency, analyze
              code evidence, identify skill gaps, and generate comprehensive SkillDNA reports. This
              capability is powered by the
              <strong className="text-slate-100"> Google Gemini API</strong> (using models such as{' '}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">
                gemini-3.7-flash
              </code>
              ).
            </p>
            <p>
              <strong className="text-slate-100">Report Context Construction:</strong> When you
              request an AI evaluation or SkillDNA assessment, our backend builds a structured
              technical payload containing:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>Your professional headline, biography, location, and target engineering role.</li>
              <li>Declared technical skills, categories, proficiency levels, and self-ratings.</li>
              <li>
                Project metadata (titles, descriptions, language breakdown, stars, and forks).
              </li>
              <li>
                Synchronized public statistics (GitHub commit counts, total coding problems solved,
                contest ratings).
              </li>
              <li>Academic backgrounds, certifications, and hackathon accomplishments.</li>
            </ul>
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Credential Safety Safeguard
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Third-party OAuth access tokens, refresh tokens, user passwords, session tokens, and
                database secrets are <strong className="text-slate-100">strictly excluded</strong>{' '}
                from the AI context builder. Authentication secrets are never transmitted to Google
                Gemini.
              </p>
            </div>
            <p>
              AI-generated scores (code quality, problem solving, system design, breadth,
              consistency) and recommendation summaries are stored in your profile records. AI
              requests are transmitted securely over TLS to Google&apos;s API endpoints. We do not
              sell your personal profile data to third parties for model training.
            </p>
          </PolicySection>

          {/* Section 07: How We Use Your Information */}
          <PolicySection
            id="use-of-data"
            eyebrow="07 / Use of Data"
            title="How We Use Your Information"
          >
            <p>We use the data we collect solely for the following functional purposes:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <strong className="text-slate-100">Authentication &amp; Session Management:</strong>{' '}
                Authenticating your identity, verifying login credentials, maintaining active
                sessions, and refreshing tokens.
              </li>
              <li>
                <strong className="text-slate-100">Technical Identity Generation:</strong> Computing
                your SkillDNA Score, radar charts, and readiness indexes from synchronized
                engineering footprint metrics.
              </li>
              <li>
                <strong className="text-slate-100">AI-Powered Career Feedback:</strong> Producing
                objective technical evaluations, identifying missing skills for target roles, and
                generating personalized growth roadmaps.
              </li>
              <li>
                <strong className="text-slate-100">Platform Synchronizations:</strong> Updating and
                syncing public contributions, problem-solving history, and repository metrics across
                your connected platforms.
              </li>
              <li>
                <strong className="text-slate-100">
                  Platform Security &amp; Fraud Prevention:
                </strong>{' '}
                Detecting unauthorized access attempts, preventing OAuth replay attacks, enforcing
                API rate limits, and maintaining security audit logs.
              </li>
            </ul>
          </PolicySection>

          {/* Section 08: Data Security & Storage Architecture */}
          <PolicySection
            id="security"
            eyebrow="08 / Safeguards"
            title="Data Security & Storage Architecture"
          >
            <p>
              We maintain reasonable technical and organizational safeguards designed to protect
              personal information against unauthorized access, loss, or disclosure:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <strong className="text-slate-100">Password Protection:</strong> Account passwords
                are cryptographically salted and hashed using Bcrypt with 12 rounds before database
                storage. Plaintext passwords are never recorded in logs or databases.
              </li>
              <li>
                <strong className="text-slate-100">Encrypted OAuth Storage:</strong> External OAuth
                access and refresh tokens (GitHub and LinkedIn) are encrypted at rest in PostgreSQL
                using AES-256-GCM authenticated encryption with a 32-byte key, random 16-byte
                initialization vectors, and authentication tags.
              </li>
              <li>
                <strong className="text-slate-100">Token-Based Session Security:</strong> Sessions
                are managed with short-lived JWT access tokens (15 minutes) and rotated refresh
                tokens (7 days). Expired or rotated refresh tokens are revoked in the database.
              </li>
              <li>
                <strong className="text-slate-100">OAuth State Verification:</strong> Third-party
                OAuth handshakes use HMAC-SHA256 cryptographically signed state tokens with
                single-use nonces and 10-minute lifespans to prevent cross-site request forgery
                (CSRF) and replay attacks.
              </li>
              <li>
                <strong className="text-slate-100">Network &amp; HTTP Hardening:</strong> API
                endpoints are protected by Helmet HTTP security headers, Cross-Origin Resource
                Sharing (CORS) whitelists, and multi-tier request rate limiters.
              </li>
            </ul>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Security Disclaimer:</strong> While we implement
              verified security controls, no internet-connected system or electronic storage method
              is completely impenetrable. We cannot guarantee absolute, unconditional security
              against all potential vulnerabilities.
            </p>
          </PolicySection>

          {/* Section 09: Data Retention, Disconnection & Deletion */}
          <PolicySection
            id="retention-deletion"
            eyebrow="09 / Retention & Deletion"
            title="Data Retention, Disconnection & Deletion"
          >
            <p>
              We believe in transparency regarding how long data is retained and the current
              capabilities of our codebase:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <strong className="text-slate-100">Platform Disconnection:</strong> You can
                disconnect GitHub, LinkedIn, or any other platform at any time from the Integrations
                page. Disconnecting immediately sets the connection status to disconnected and{' '}
                <strong className="text-slate-100">
                  wipes stored OAuth access and refresh tokens (sets them to null)
                </strong>{' '}
                in the database.
              </li>
              <li>
                <strong className="text-slate-100">Retention of Synchronized Profile Data:</strong>{' '}
                Historical statistics and imported repository cards previously synchronized into
                your profile remain saved in the database after disconnection until you replace or
                request their removal.
              </li>
              <li>
                <strong className="text-slate-100">Account Deletion Status:</strong> A self-service,
                automated &ldquo;delete account&rdquo; button is{' '}
                <strong className="text-slate-100">not currently implemented</strong> in the web
                interface. To delete your account and associated profile records, you must contact
                our privacy team as detailed below.
              </li>
              <li>
                <strong className="text-slate-100">Data Export Status:</strong> An automated
                self-service data export portal is not currently implemented in the application.
                Data access or export requests are handled manually upon request.
              </li>
              <li>
                <strong className="text-slate-100">
                  Inactive Accounts &amp; Retention Lifecycle:
                </strong>{' '}
                Accounts are not automatically deleted solely because they become inactive, and no
                automated inactive-account deletion or archival routine is currently implemented.
                Account records and synchronized historical data may remain stored until you submit
                a deletion request or until records are otherwise handled in accordance with
                applicable legal requirements. Users can contact the operator at{' '}
                <a
                  href="mailto:ksparu12@gmail.com"
                  className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                >
                  ksparu12@gmail.com
                </a>{' '}
                to request account deletion, which is processed manually. Certain operational
                records, such as security audit logs, or information required to comply with
                applicable legal obligations may be retained where required by law.
              </li>
            </ul>
          </PolicySection>

          {/* Section 10: Browser Storage & Cookies */}
          <PolicySection
            id="browser-storage"
            eyebrow="10 / Storage & Cookies"
            title="Browser Storage & Cookies"
          >
            <p>SkillDNA AI uses browser web storage to provide authenticated access:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <strong className="text-slate-100">Local Storage:</strong> Our client application
                saves your active JWT access token and refresh token in browser{' '}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-200">
                  localStorage
                </code>
                . This enables your session to persist across page refreshes. These tokens are
                cleared upon clicking &ldquo;Sign Out&rdquo;.
              </li>
              <li>
                <strong className="text-slate-100">No Tracking Pixels:</strong> The core SkillDNA AI
                application code does not embed advertising trackers, third-party remarketing
                pixels, or behavioral cross-site analytics.
              </li>
              <li>
                <strong className="text-slate-100">Hosting &amp; Network Infrastructure:</strong>{' '}
                Our production architecture relies on specialized cloud services: the frontend web
                application is hosted on Vercel and distributed across its global edge network; the
                backend REST API operates as a Render web service behind Render&apos;s reverse-proxy
                ingress; relational data is persisted in a Supabase-managed PostgreSQL database with
                PgBouncer connection pooling. Our application code does not set cookies or use
                cookie-based session authentication. Authentication tokens are stored in browser
                localStorage, and authenticated API requests are made over HTTPS.
              </li>
            </ul>
          </PolicySection>

          {/* Section 11: Your Rights & Choices */}
          <PolicySection id="user-rights" eyebrow="11 / Your Rights" title="Your Rights & Choices">
            <p>You have the following rights and controls over your information:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-400">
              <li>
                <strong className="text-slate-100">Access &amp; Review:</strong> You can view your
                stored profile information, connected platforms, and synchronized metrics directly
                by visiting your Profile, Dashboard, and Integrations pages.
              </li>
              <li>
                <strong className="text-slate-100">Rectification &amp; Updates:</strong> You can
                update your career details, target roles, project descriptions, and self-assessed
                skill proficiencies at any time through the Profile interface.
              </li>
              <li>
                <strong className="text-slate-100">Platform Disconnection:</strong> You can revoke
                SkillDNA AI&apos;s connection to your GitHub or LinkedIn account at will from the
                Integrations tab. You may also revoke authorized access directly within your GitHub
                or LinkedIn third-party application settings.
              </li>
              <li>
                <strong className="text-slate-100">Data Subject Inquiries &amp; Erasure:</strong> To
                request a copy of your personal data, request correction of inaccurate records, or
                request complete account erasure, submit a verified request to our privacy contact.
                We will verify your identity using your registered account email before fulfilling
                the request.
              </li>
            </ul>
          </PolicySection>

          {/* Section 12: Privacy Contact & Inquiries */}
          <PolicySection id="contact" eyebrow="12 / Contact" title="Privacy Contact & Inquiries">
            <p>
              If you have questions about this Privacy Policy, wish to exercise your data protection
              rights, or need to submit an account deletion request, please reach out to our team:
            </p>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Privacy Contact
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-300">
                  <a
                    href="mailto:ksparu12@gmail.com"
                    className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                  >
                    ksparu12@gmail.com
                  </a>{' '}
                  <span className="text-xs text-slate-400 font-sans">
                    (Direct developer inbox for privacy inquiries and data requests)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Operating Organization &amp; Location
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  <span className="font-medium text-slate-200">
                    Parmesh KS (Individual Project Operator)
                  </span>{' '}
                  &bull; Infrastructure Regions: Vercel Functions — Washington, D.C., USA (iad1);
                  Render backend — Singapore (Southeast Asia); Supabase database — Mumbai, India
                  (ap-south-1).
                </p>
              </div>
            </div>
            <p className="text-xs leading-6 text-slate-500 mt-4">
              Please include your registered email address and a clear description of your inquiry
              or request so we can authenticate your identity and assist you promptly.
            </p>
          </PolicySection>

          {/* Policy Footer Note */}
          <div className="border-t border-white/10 py-6 text-xs leading-6 text-slate-500">
            This policy accurately represents the verified architecture, data models, third-party
            integrations, and security mechanisms implemented in the SkillDNA AI codebase. When
            deploying changes to legal entity status, production cloud hosting, or data retention
            schedules, update the marked placeholder items accordingly.
          </div>
        </article>
      </div>
    </div>
  );
}
