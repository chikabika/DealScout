import 'dotenv/config'
import bcrypt from 'bcrypt'

/**
 * Generate the bcrypt hash to put in ADMIN_MASTER_PASSWORD_HASH.
 *
 * Usage:
 *   npx tsx scripts/hash-master-password.ts 'your-strong-master-password'
 *
 * Then set the printed hash (NOT the plaintext) as ADMIN_MASTER_PASSWORD_HASH
 * in your deployment env. Leave it unset to disable the master-login feature.
 */
async function main() {
  const password = process.argv[2]
  if (!password) {
    console.error("Usage: npx tsx scripts/hash-master-password.ts '<master-password>'")
    process.exit(1)
  }
  if (password.length < 16) {
    console.error('❌ Refusing to hash a master password shorter than 16 chars.')
    console.error('   This one secret unlocks every account — make it long and random.')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  console.log('\nADMIN_MASTER_PASSWORD_HASH=' + hash)
  console.log('\nSet the line above in your env (Vercel → Environment Variables).')
  console.log('Store the plaintext password only in a password manager — never in the repo or env.')
  process.exit(0)
}

main()
