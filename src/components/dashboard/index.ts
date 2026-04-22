// src/components/dashboard/index.ts

// Legacy widgets — used by the current CareerUniverse dashboard.
// Will be retired in Pass 2d-iii alongside the dashboard switch.
export { CurrentFocusWidget } from "./CurrentFocusWidget"
export { RoleProgressHeader } from "./RoleProgressHeader"

// Pass 2d redesign — staged. Wired into src/app/page.tsx in Pass 2d-iii.
export { DashboardGreeting } from "./DashboardGreeting"
export { StreakGrid } from "./StreakGrid"
export { NextStepsCard } from "./NextStepsCard"
export { PathSnapshotCard } from "./PathSnapshotCard"
export { WeekStatsCard } from "./WeekStatsCard"
export { AdminResponsibilitiesCard } from "./AdminResponsibilitiesCard"
