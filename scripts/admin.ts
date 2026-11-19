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
//
// The key file is a service account for that project. Keep it outside the repo.
// Against the local emulators (npm run dev:local), leave out the key and use --project demo-job-tracker.
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { addBusiness, addMember, listBusinesses, listMembers, removeMember } from './members.ts'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const args = process.argv.slice(2)
const projectFlag = args.indexOf('--project')
// Always named, so a command can't land on the wrong project by accident
const projectId = projectFlag >= 0 ? args[projectFlag + 1] : undefined
if (!projectId) fail('Name the project: --project <project-id>  (see the top of scripts/admin.ts)')
const [command, ...rest] = args.filter((_, i) => i !== projectFlag && i !== projectFlag + 1)

const emulated = !!process.env.FIRESTORE_EMULATOR_HOST
if (!emulated && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  fail('Set GOOGLE_APPLICATION_CREDENTIALS to the service account key file for this project.')
}
console.error(`[${projectId}${emulated ? ', emulators' : ''}]`)

initializeApp({ projectId })
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
  default:
    fail(`Unknown command ${command ?? '(none)'}. See the top of scripts/admin.ts.`)
}
