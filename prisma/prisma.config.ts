// prisma.config.ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    url: process.env.DATABASE_URL,
  },
})
