import { Account, Client, Databases, Storage } from 'appwrite'
import fs from 'node:fs'
import path from 'node:path'

const parseEnvFile = (file) => {
  const fullPath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(fullPath)) return {}

  const result = {}
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    result[key] = value
  }
  return result
}

const env = {
  ...parseEnvFile('.env'),
  ...parseEnvFile('.env.local'),
  ...process.env,
}

const required = [
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'NEXT_PUBLIC_DATABASE_ID',
  'NEXT_PUBLIC_TODOS_COLLECTION_ID',
  'NEXT_PUBLIC_IMAGES_BUCKET_ID',
]

const missing = required.filter((key) => !env[key])
if (missing.length > 0) {
  console.error('Missing required values:')
  for (const key of missing) console.error(`- ${key}`)
  process.exit(1)
}

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

const account = new Account(client)
const databases = new Databases(client)
const storage = new Storage(client)

console.log('Project:', env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
console.log('Database:', env.NEXT_PUBLIC_DATABASE_ID)
console.log('Table/Collection:', env.NEXT_PUBLIC_TODOS_COLLECTION_ID)
console.log('Bucket:', env.NEXT_PUBLIC_IMAGES_BUCKET_ID)
console.log('---')

try {
  const session = await account.createAnonymousSession()
  console.log('Anonymous session: OK')
  console.log('Session userId:', session.userId)
} catch (error) {
  console.error('Anonymous session: FAILED')
  console.error(`Reason: [${error?.code}] ${error?.message}`)
  console.error('Fix: Enable Anonymous auth method in Appwrite.')
}

try {
  const data = await databases.listDocuments(
    env.NEXT_PUBLIC_DATABASE_ID,
    env.NEXT_PUBLIC_TODOS_COLLECTION_ID
  )
  console.log(`Table read: OK (documents=${data.total})`)
} catch (error) {
  console.error('Table read: FAILED')
  console.error(`Reason: [${error?.code}] ${error?.message}`)
  if (error?.code === 401) {
    console.error(
      'Fix: Add Users/Any read permission on database + table (and row security if enabled).'
    )
  }
  if (error?.code === 404) {
    console.error('Fix: NEXT_PUBLIC_TODOS_COLLECTION_ID must be the table ID, not table name.')
  }
}

try {
  const data = await storage.listFiles(env.NEXT_PUBLIC_IMAGES_BUCKET_ID)
  console.log(`Bucket read: OK (files=${data.total})`)
} catch (error) {
  console.error('Bucket read: FAILED')
  console.error(`Reason: [${error?.code}] ${error?.message}`)
  if (error?.code === 401) {
    console.error('Fix: Add Users/Any read permission on the bucket.')
  }
  if (error?.code === 404) {
    console.error('Fix: NEXT_PUBLIC_IMAGES_BUCKET_ID must be the real bucket ID.')
  }
}
