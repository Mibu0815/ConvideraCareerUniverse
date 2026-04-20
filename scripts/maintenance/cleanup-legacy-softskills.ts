import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

const MASTER_SLUGS = [
  'analytical-thinking', 'appearance', 'assertiveness', 'collaboration',
  'commercial-awareness', 'communication-skills', 'confidence', 'conflict-ability',
  'coordination-skills', 'creativity', 'critical-faculty', 'critical-thinking',
  'decision-making-skills', 'diligence', 'diplomatic-skills', 'disruptive-thinking',
  'entrepreneurial-thinking', 'flexibility', 'goal-orientation',
  'individual-responsibility', 'intercultural-competency', 'leadership-competency',
  'negotiating-skills', 'networking', 'organizational-capability',
  'outside-the-box-thinking', 'perseverance', 'persistence', 'power-of-abstraction',
  'presentation-skills', 'proactivity', 'problem-solving-skills',
  'pyramidal-communication', 'reliability', 'resilience', 'self-awareness',
  'self-management', 'self-reliance', 'sense-of-responsibility', 'service-orientation',
  'shaping-skills', 'solution-orientation', 'strategic-thinking', 'structuredness',
  'time-management',
]

async function main() {
  const legacy = await prisma.softSkill.findMany({
    where: { slug: { notIn: MASTER_SLUGS } },
    include: { _count: { select: { Role: true } } },
  })

  const withReferences = legacy.filter(s => s._count.Role > 0)
  if (withReferences.length > 0) {
    console.error('Abbruch: Legacy-Skills mit Referenzen gefunden:')
    withReferences.forEach(s => console.error(`  ${s.slug} -> ${s._count.Role} roles`))
    process.exit(1)
  }

  const backupPath = `/tmp/legacy-softskills-backup-${Date.now()}.json`
  fs.writeFileSync(backupPath, JSON.stringify(legacy, null, 2))

  const result = await prisma.softSkill.deleteMany({
    where: { slug: { notIn: MASTER_SLUGS } },
  })

  console.log(`${result.count} Legacy Soft Skills geloescht`)
  console.log(`Backup: ${backupPath}`)

  const total = await prisma.softSkill.count()
  console.log(`DB jetzt: ${total} Soft Skills (erwartet: 45)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
