'use client'

import { useState } from 'react'
import { getTimelineExportData } from '@/lib/services/evidence-timeline'

interface TimelineExportButtonProps {
  userId: string
  userName?: string
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function TimelineExportButton({
  userId,
  userName,
}: TimelineExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const data = await getTimelineExportData(userId)

      const byField = data.reduce(
        (acc, ev) => {
          const field = ev.skill.CompetenceField.title
          if (!acc[field]) acc[field] = []
          acc[field].push(ev)
          return acc
        },
        {} as Record<string, typeof data>,
      )

      const sectionsHtml = Object.entries(byField)
        .map(([field, skills]) => {
          const skillsHtml = skills
            .map((ev) => {
              const validatedDate = ev.validatedAt
                ? new Date(ev.validatedAt).toLocaleDateString('de-DE')
                : ''
              const validator = ev.validatedBy
                ? `
                  <div class="validator">
                    Validiert von ${escapeHtml(ev.validatedBy.name ?? ev.validatedBy.email)} · ${validatedDate}
                  </div>
                `
                : ''
              return `
                <div class="skill">
                  <div class="skill-name">
                    ${escapeHtml(ev.skill.title)}
                    <span class="badge" style="margin-left:8px">Level ${ev.validatedLevel ?? ''}</span>
                  </div>
                  <div class="skill-meta">${escapeHtml(ev.title)}</div>
                  ${validator}
                </div>
              `
            })
            .join('')

          return `
            <div class="section">
              <div class="field">${escapeHtml(field)}</div>
              ${skillsHtml}
            </div>
          `
        })
        .join('')

      const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Skill-Portfolio — ${escapeHtml(userName ?? userId)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
    h1 { font-size: 24px; font-weight: 500; margin-bottom: 4px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 40px; }
    .section { margin-bottom: 32px; }
    .field { font-size: 11px; font-weight: 600; text-transform: uppercase;
             letter-spacing: 0.08em; color: #0055FF; margin-bottom: 12px; }
    .skill { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
    .skill-name { font-size: 15px; font-weight: 500; }
    .skill-meta { font-size: 12px; color: #888; margin-top: 4px; }
    .badge { display: inline-block; background: #e8f0ff; color: #0055FF;
             font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; }
    .validator { font-size: 12px; color: #555; margin-top: 8px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Skill-Portfolio</h1>
  <div class="meta">
    ${escapeHtml(userName ?? '')} · Erstellt am ${new Date().toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} · ${data.length} validierte Skills
  </div>
  ${sectionsHtml}
</body>
</html>`

      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
    } catch (e) {
      console.error('Export fehlgeschlagen', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <span>{loading ? 'Wird erstellt...' : 'Portfolio exportieren'}</span>
    </button>
  )
}
