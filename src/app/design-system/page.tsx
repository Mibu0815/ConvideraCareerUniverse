import { redirect } from 'next/navigation'
import { ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth/permissions'
import { PageShell, PageHeader, Section, Card, Button, Status } from '@/components/layout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Design System | Career Universe',
  description: 'Living styleguide for Career Universe 2.0',
}

const COLOR_SWATCHES = [
  { group: 'Neutral', items: [
    { name: 'canvas',          token: 'bg-canvas',          rgbVar: '--canvas' },
    { name: 'canvas-dark',     token: 'bg-canvas-dark',     rgbVar: '--canvas-dark' },
    { name: 'surface',         token: 'bg-surface',         rgbVar: '--surface' },
    { name: 'surface-soft',    token: 'bg-surface-soft',    rgbVar: '--surface-soft' },
    { name: 'border',          token: 'bg-border',          rgbVar: '--border' },
    { name: 'border-strong',   token: 'bg-border-strong',   rgbVar: '--border-strong' },
    { name: 'divider',         token: 'bg-divider',         rgbVar: '--divider' },
  ]},
  { group: 'Text', items: [
    { name: 'text-primary',    token: 'bg-text-primary',    rgbVar: '--text-primary' },
    { name: 'text-secondary',  token: 'bg-text-secondary',  rgbVar: '--text-secondary' },
    { name: 'text-muted',      token: 'bg-text-muted',      rgbVar: '--text-muted' },
    { name: 'text-inverse',    token: 'bg-text-inverse',    rgbVar: '--text-inverse' },
  ]},
  { group: 'Brand', items: [
    { name: 'brand-dot',          token: 'bg-brand-dot',          rgbVar: '--brand-dot' },
    { name: 'brand-blue',         token: 'bg-brand-blue',         rgbVar: '--brand-blue' },
    { name: 'brand-blue-hover',   token: 'bg-brand-blue-hover',   rgbVar: '--brand-blue-hover' },
    { name: 'brand-blue-subtle',  token: 'bg-brand-blue-subtle',  rgbVar: '--brand-blue-subtle' },
  ]},
  { group: 'Zones', items: [
    { name: 'zone-personal',       token: 'bg-zone-personal',       rgbVar: '--zone-personal' },
    { name: 'zone-personal-soft',  token: 'bg-zone-personal-soft',  rgbVar: '--zone-personal-soft' },
    { name: 'zone-admin',          token: 'bg-zone-admin',          rgbVar: '--zone-admin' },
    { name: 'zone-admin-soft',     token: 'bg-zone-admin-soft',     rgbVar: '--zone-admin-soft' },
    { name: 'zone-domain',         token: 'bg-zone-domain',         rgbVar: '--zone-domain' },
    { name: 'zone-domain-soft',    token: 'bg-zone-domain-soft',    rgbVar: '--zone-domain-soft' },
  ]},
  { group: 'Status', items: [
    { name: 'status-success',       token: 'bg-status-success',       rgbVar: '--success' },
    { name: 'status-success-soft',  token: 'bg-status-success-soft',  rgbVar: '--success-soft' },
    { name: 'status-warning',       token: 'bg-status-warning',       rgbVar: '--warning' },
    { name: 'status-warning-soft',  token: 'bg-status-warning-soft',  rgbVar: '--warning-soft' },
    { name: 'status-danger',        token: 'bg-status-danger',        rgbVar: '--danger' },
    { name: 'status-danger-soft',   token: 'bg-status-danger-soft',   rgbVar: '--danger-soft' },
    { name: 'status-info',          token: 'bg-status-info',          rgbVar: '--info' },
    { name: 'status-info-soft',     token: 'bg-status-info-soft',     rgbVar: '--info-soft' },
  ]},
  { group: 'Skill Levels', items: [
    { name: 'level-1', token: 'bg-level-1', rgbVar: '--level-1' },
    { name: 'level-2', token: 'bg-level-2', rgbVar: '--level-2' },
    { name: 'level-3', token: 'bg-level-3', rgbVar: '--level-3' },
    { name: 'level-4', token: 'bg-level-4', rgbVar: '--level-4' },
  ]},
] as const

const TYPE_SCALE = [
  { name: 'display-xl', cls: 'text-display-xl' },
  { name: 'display-l',  cls: 'text-display-l' },
  { name: 'h1',         cls: 'text-h1' },
  { name: 'h2',         cls: 'text-h2' },
  { name: 'h3',         cls: 'text-h3' },
  { name: 'h4',         cls: 'text-h4' },
  { name: 'body-l',     cls: 'text-body-l' },
  { name: 'body',       cls: 'text-body' },
  { name: 'body-s',     cls: 'text-body-s' },
  { name: 'caption',    cls: 'text-caption uppercase tracking-wider' },
  { name: 'overline',   cls: 'text-overline uppercase tracking-widest' },
]

const SPACING_SCALE = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32]
const RADII_EXAMPLES = [
  { radius: 'sm', label: '6px',  usage: 'Chips, small inputs, icon buttons' },
  { radius: 'md', label: '10px', usage: 'Buttons, text inputs, dropdowns' },
  { radius: 'lg', label: '16px', usage: 'Cards, panels, dialogs' },
  { radius: 'xl', label: '24px', usage: 'Hero cards, statement elements' },
] as const
const SHADOWS = [
  { name: 'xs', cls: 'shadow-xs' },
  { name: 'sm', cls: 'shadow-sm' },
  { name: 'md', cls: 'shadow-md' },
  { name: 'lg', cls: 'shadow-lg' },
]

export default async function DesignSystemPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.id) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (!dbUser || !isAdmin(dbUser)) redirect('/?error=unauthorized')

  return (
    <PageShell width="full">
      <PageHeader
        title="Design System"
        description="Living styleguide for Career Universe 2.0 — token-based design language aligned with Convidera brand."
        eyebrow="Internal Reference"
        accent
      />

      <Section title="Colors" description="Token-based color palette. All values exposed as Tailwind classes and CSS variables.">
        <div className="space-y-8">
          {COLOR_SWATCHES.map(group => (
            <div key={group.group}>
              <p className="text-overline uppercase text-text-muted mb-3">{group.group}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.items.map(c => (
                  <Card key={c.name} variant="default" padding="sm">
                    <div
                      className={`${c.token} h-16 w-full rounded-md border border-border mb-2`}
                      aria-hidden
                    />
                    <p className="text-body-s text-text-primary font-medium">{c.name}</p>
                    <p className="text-caption text-text-muted font-mono">{c.rgbVar}</p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography" description="Inter via next/font with cv11 + ss01 features." divider>
        <div className="space-y-4">
          {TYPE_SCALE.map(t => (
            <div key={t.name} className="flex items-baseline gap-6 pb-4 border-b border-divider">
              <span className="text-caption uppercase text-text-muted font-mono w-24 shrink-0">
                {t.name}
              </span>
              <span className={`${t.cls} text-text-primary`}>
                The quick brown fox
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing" description="4px base unit." divider>
        <div className="space-y-2">
          {SPACING_SCALE.map(n => (
            <div key={n} className="flex items-center gap-4">
              <span className="text-caption uppercase text-text-muted font-mono w-12">{n}</span>
              <div
                className="h-3 bg-brand-blue rounded-sm"
                style={{ width: `${n * 4}px` }}
                aria-hidden
              />
              <span className="text-body-s text-text-secondary">{n * 4}px</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Border Radius" description="Different scales for different UI elements" divider>
        <div className="space-y-8">
          {RADII_EXAMPLES.map(({ radius, label, usage }) => (
            <div key={radius} className="flex items-start gap-8">
              <div className="w-32 shrink-0">
                <p className="text-h4 text-text-primary">{radius}</p>
                <p className="text-caption text-text-muted">{label}</p>
                <p className="text-body-s text-text-secondary mt-2">{usage}</p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 bg-surface border border-border text-body-s rounded-${radius}`}>
                  Skill Chip
                </span>
                <button className={`h-10 px-4 bg-brand-blue text-white text-body font-medium rounded-${radius}`}>
                  Action Button
                </button>
                <div className={`px-5 py-4 bg-surface border border-border rounded-${radius} max-w-xs`}>
                  <p className="text-body font-medium text-text-primary">Card Surface</p>
                  <p className="text-body-s text-text-secondary mt-1">
                    Realistic content example
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows" divider>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
          {SHADOWS.map(s => (
            <div key={s.name} className="text-center">
              <div className={`${s.cls} bg-surface h-24 w-full rounded-lg mb-2`} aria-hidden />
              <p className="text-body-s font-medium text-text-primary">{s.name}</p>
              <p className="text-caption text-text-muted font-mono">{s.cls}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Card Variants" divider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default">
            <p className="text-overline uppercase text-text-muted mb-2">default</p>
            <p className="text-body text-text-primary">White surface, subtle border. The workhorse.</p>
          </Card>
          <Card variant="subtle">
            <p className="text-overline uppercase text-text-muted mb-2">subtle</p>
            <p className="text-body text-text-primary">Off-white. For nested cards.</p>
          </Card>
          <Card variant="dark">
            <p className="text-overline uppercase text-text-muted mb-2">dark</p>
            <p className="text-body text-text-inverse">Charcoal. Admin / statement.</p>
          </Card>
          <Card variant="accent">
            <p className="text-overline uppercase text-text-muted mb-2">accent</p>
            <p className="text-body text-text-primary">Brand-blue tint. AI / focus elements.</p>
          </Card>
        </div>
      </Section>

      <Section title="Zone Indicators" divider>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-zone-personal-soft text-zone-personal text-body-s font-medium rounded-pill">
            <span className="h-2 w-2 rounded-pill bg-zone-personal" />
            Meine Entwicklung
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-zone-admin-soft text-zone-admin text-body-s font-medium rounded-pill">
            <span className="h-2 w-2 rounded-pill bg-zone-admin" />
            Plattform-Verwaltung
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-zone-domain-soft text-zone-domain text-body-s font-medium rounded-pill">
            <span className="h-2 w-2 rounded-pill bg-zone-domain" />
            Domain Expert
          </span>
        </div>
      </Section>

      <Section title="Buttons" description="Variants and sizes" divider>
        <div className="space-y-8">
          <div>
            <p className="text-caption uppercase text-text-muted mb-3">Variants</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="primary">Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="dark">Dark</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div>
            <p className="text-caption uppercase text-text-muted mb-3">Sizes</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="md">Medium (default)</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div>
            <p className="text-caption uppercase text-text-muted mb-3">With Icons</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button iconLeft={<ArrowRight className="h-4 w-4 rotate-180" />}>Back</Button>
              <Button iconRight={<ArrowRight className="h-4 w-4" />}>Continue</Button>
              <Button variant="secondary" iconLeft={<Plus className="h-4 w-4" />}>
                Add skill
              </Button>
            </div>
          </div>

          <div>
            <p className="text-caption uppercase text-text-muted mb-3">States</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
          </div>

          <div>
            <p className="text-caption uppercase text-text-muted mb-3">Full Width</p>
            <div className="max-w-md">
              <Button fullWidth iconRight={<ArrowRight className="h-4 w-4" />}>
                Impuls fortsetzen
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Status" description="Pills, inline and banner variants" divider>
        <div className="space-y-6">
          <div>
            <p className="text-caption uppercase text-text-muted mb-3">Pills</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Status type="success">Validated</Status>
              <Status type="warning">Pending Review</Status>
              <Status type="danger">Rejected</Status>
              <Status type="info">In Progress</Status>
            </div>
          </div>

          <div>
            <p className="text-caption uppercase text-text-muted mb-3">Inline</p>
            <div className="flex items-center gap-6 flex-wrap">
              <Status type="success" variant="inline">3 skills validated</Status>
              <Status type="warning" variant="inline">2 awaiting validation</Status>
              <Status type="danger" variant="inline">1 rejected</Status>
              <Status type="info" variant="inline">5 in progress</Status>
            </div>
          </div>

          <div>
            <p className="text-caption uppercase text-text-muted mb-3">Banner</p>
            <div className="space-y-3 max-w-2xl">
              <Status type="success" variant="banner">
                <strong>Skill validated.</strong> Your evidence has been approved
                by the domain expert.
              </Status>
              <Status type="warning" variant="banner">
                <strong>17 Kompetenzfelder ohne Domain Experten.</strong>{' '}
                Validations are blocked for these fields.
              </Status>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Skill Level Progression" description="Blue scale L1 (Learner) → L4 (Master)." divider>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map(level => (
            <span
              key={level}
              className={`inline-flex items-center px-4 py-2 text-body-s font-semibold rounded-md bg-level-${level} ${level >= 3 ? 'text-text-inverse' : 'text-text-primary'}`}
            >
              L{level}
            </span>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}
