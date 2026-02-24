import fs from 'node:fs'
import path from 'node:path'

const requiredVars = [
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'NEXT_PUBLIC_DATABASE_ID',
  'NEXT_PUBLIC_TODOS_COLLECTION_ID',
  'NEXT_PUBLIC_IMAGES_BUCKET_ID',
]

const envFiles = ['.env.local', '.env']

for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(fullPath)) continue

  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const missing = requiredVars.filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error('Missing required environment variables:')
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

console.log('Environment check passed.')
