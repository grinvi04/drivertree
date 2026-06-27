import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { SEED_CONTENTS } from './seeds/content.data'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  let inserted = 0
  for (const post of SEED_CONTENTS) {
    const existing = await prisma.content.findUnique({ where: { slug: post.slug } })
    if (!existing) {
      await prisma.content.create({ data: post })
      inserted++
    }
  }
  console.log(
    `[Seed] ${inserted} new content(s) inserted, ${SEED_CONTENTS.length - inserted} already present.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
