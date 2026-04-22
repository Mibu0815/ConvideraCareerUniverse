interface DashboardGreetingProps {
  name?: string
}

export function DashboardGreeting({ name }: DashboardGreetingProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const firstName = name?.split(' ')[0]

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mb-8">
      <p className="text-caption uppercase text-text-muted mb-2">{today}</p>
      <h1 className="text-h1 text-text-primary">
        {greeting}{firstName ? `, ${firstName}` : ''}
      </h1>
    </div>
  )
}
