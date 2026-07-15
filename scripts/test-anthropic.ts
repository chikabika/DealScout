import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

async function main() {
  console.log('=== Anthropic API connectivity test ===')
  console.log('ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY)
  console.log('ANTHROPIC_CLASSIFIER_MODEL_ID:', process.env.ANTHROPIC_CLASSIFIER_MODEL_ID || '(default: claude-haiku-4-5)')
  console.log('ANTHROPIC_SCORER_MODEL_ID:', process.env.ANTHROPIC_SCORER_MODEL_ID || process.env.ANTHROPIC_MODEL_ID || '(default: claude-sonnet-4-5)')
  console.log('')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Missing ANTHROPIC_API_KEY in .env.local')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const model = process.env.ANTHROPIC_CLASSIFIER_MODEL_ID || 'claude-haiku-4-5'

  try {
    console.log('Calling Anthropic API with model:', model)
    const res = await client.messages.create({
      model,
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Reply with just: ANTHROPIC_OK' }],
    })
    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    console.log('✅ Anthropic response:', text.trim())
    console.log('   Input tokens:', res.usage.input_tokens, '/ Output tokens:', res.usage.output_tokens)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('❌ Anthropic call failed:', msg)
    console.error('')
    console.error('Common causes:')
    console.error('  1. Invalid or missing ANTHROPIC_API_KEY (get one at https://console.anthropic.com)')
    console.error('  2. The model id is wrong or not available to your account:', model)
    console.error('  3. Insufficient credits / billing not set up on the Anthropic account')
    process.exit(1)
  }
  process.exit(0)
}

main()
