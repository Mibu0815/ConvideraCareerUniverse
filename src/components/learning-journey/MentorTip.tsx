import { Zap } from 'lucide-react'

interface MentorTipProps {
  skillTitle?: string | null
}

export function MentorTip({ skillTitle }: MentorTipProps) {
  const text = skillTitle
    ? `Fokussiere dich auf "${skillTitle}" — kleine, regelmäßige Übungen bringen dich schneller ans Ziel.`
    : 'Wähle bis zu 3 Skills aus, um personalisierte Übungen zu erhalten.'

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-md bg-brand-blue-subtle border border-brand-blue/10">
      <Zap className="h-4 w-4 text-brand-blue shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-caption uppercase text-text-muted mb-1">AI Mentor Tipp</p>
        <p className="text-body-s text-text-primary">{text}</p>
      </div>
    </div>
  )
}
