// Manages who can use the app. Run with Node 22+ (it runs TypeScript as-is):
//
//   GOOGLE_APPLICATION_CREDENTIALS=~/keys/beta-admin.json node scripts/admin.ts --project <project-id> <command>
//
// Commands:
//   businesses                        list the businesses and their IDs
//   add-business <name>               create a business; prints its ID
//   members <businessId>              list a business's members
//   add-member <businessId> <email>   give someone access (creates their login); prints a link for them to set a password
//   remove-member <businessId> <email>
//   import-live <businessId> --from <live-project-id> [--dry-run]
//                                     copy the live project's data into this business (see scripts/migrate.ts);
//                                     set FROM_CREDENTIALS to a key file for the live project
//
// The key file is a service account for that project. Keep it outside the repo.
// Against the local emulators (npm run dev:local), leave out the key and use --project demo-job-tracker.
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { addBusiness, addMember, listBusinesses, listMembers, removeMember } from './members.ts'
import { importLive } from './migrate.ts'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const args = process.argv.slice(2)
// --name value pairs, taken out of the arguments
function option(name: string) {
  const at = args.indexOf(name)
  if (at < 0) return undefined
  const [, value] = args.splice(at, 2)
  return value
}
// Always named, so a command can't land on the wrong project by accident
const projectId = option('--project')
if (!projectId) fail('Name the project: --project <project-id>  (see the top of scripts/admin.ts)')
const fromProjectId = option('--from')
const dryRun = args.includes('--dry-run')
const [command, ...rest] = args.filter(arg => arg !== '--dry-run')

const emulated = !!process.env.FIRESTORE_EMULATOR_HOST
if (!emulated && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  fail('Set GOOGLE_APPLICATION_CREDENTIALS to the service account key file for this project.')
}
console.error(`[${projectId}${emulated ? ', emulators' : ''}]`)

// The default bucket name for projects made since late 2024; older ones use <project>.appspot.com
initializeApp({ projectId, storageBucket: process.env.STORAGE_BUCKET ?? `${projectId}.firebasestorage.app` })
const db = getFirestore()
const auth = getAuth()

function need(count: number, usage: string) {
  if (rest.length !== count) fail(`Usage: ${command} ${usage}`)
  return rest
}

switch (command) {
  case 'businesses':
    for (const b of await listBusinesses(db)) console.log(`${b.id}  ${b.name}`)
    break
  case 'add-business': {
    const [name] = need(1, '<name>')
    console.log(await addBusiness(db, name))
    break
  }
  case 'members': {
    const [businessId] = need(1, '<businessId>')
    for (const m of await listMembers(db, businessId)) console.log(`${m.uid}  ${m.email}`)
    break
  }
  case 'add-member': {
    const [businessId, email] = need(2, '<businessId> <email>')
    const { resetLink } = await addMember(db, auth, businessId, email)
    console.log(`${email} can now use the app. Send them this link to set their password:\n${resetLink}`)
    break
  }
  case 'remove-member': {
    const [businessId, email] = need(2, '<businessId> <email>')
    await removeMember(db, auth, businessId, email)
    console.log(`${email} no longer has access, and their login is turned off.`)
    break
  }
  case 'import-live': {
    const [businessId] = need(1, '<businessId> --from <live-project-id> [--dry-run]')
    if (!fromProjectId) fail('Name the live project to copy from: --from <live-project-id>')
    if (fromProjectId === projectId) fail('--from must be the live project, not the one being copied into')
    const fromKey = process.env.FROM_CREDENTIALS
    if (!emulated && !fromKey) fail('Set FROM_CREDENTIALS to a service account key file for the live project.')
    const live = initializeApp({
      projectId: fromProjectId,
      storageBucket: process.env.FROM_STORAGE_BUCKET ?? `${fromProjectId}.firebasestorage.app`,
      ...(fromKey && { credential: cert(JSON.parse(readFileSync(fromKey, 'utf8'))) }),
    }, 'live')
    const counts = await importLive(
      { db: getFirestore(live), bucket: getStorage(live).bucket() },
      { db, bucket: getStorage().bucket() },
      businessId,
      { dryRun },
    )
    console.log(dryRun ? 'Would copy (nothing written):' : 'Copied:')
    for (const [kind, count] of Object.entries(counts)) console.log(`  ${kind}: ${count}`)
    break
  }
  default:
    fail(`Unknown command ${command ?? '(none)'}. See the top of scripts/admin.ts.`)
}
