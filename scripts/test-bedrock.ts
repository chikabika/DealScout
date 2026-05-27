import 'dotenv/config'
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk'

async function main() {
  console.log('=== Bedrock connectivity test ===')
  console.log('AWS_DEFAULT_REGION:', process.env.AWS_DEFAULT_REGION || '(not set)')
  console.log('BEDROCK_MODEL_ID:', process.env.BEDROCK_MODEL_ID || '(not set)')
  console.log('AWS_ACCESS_KEY_ID present:', !!process.env.AWS_ACCESS_KEY_ID)
  console.log('AWS_SECRET_ACCESS_KEY present:', !!process.env.AWS_SECRET_ACCESS_KEY)
  console.log('')

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Missing AWS credentials in .env.local')
    process.exit(1)
  }
  if (!process.env.BEDROCK_MODEL_ID) {
    console.error('❌ Missing BEDROCK_MODEL_ID in .env.local')
    process.exit(1)
  }

  const client = new AnthropicBedrock({
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  })

  try {
    console.log('Calling Bedrock...')
    const res = await client.messages.create({
      model: process.env.BEDROCK_MODEL_ID,
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Reply with just: BEDROCK_OK' }],
    })
    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    console.log('✅ Bedrock response:', text.trim())
    console.log('   Input tokens:', res.usage.input_tokens, '/ Output tokens:', res.usage.output_tokens)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('❌ Bedrock failed:', msg)
    console.error('')
    console.error('Common causes:')
    console.error('  1. Model access not granted in AWS Console → Bedrock → Model access')
    console.error('     Request access for model:', process.env.BEDROCK_MODEL_ID)
    console.error('  2. IAM user lacks "bedrock:InvokeModel" permission')
    console.error('     Attach AmazonBedrockFullAccess policy to IAM user')
    console.error('  3. Model not available in region:', process.env.AWS_DEFAULT_REGION)
    process.exit(1)
  }
  process.exit(0)
}

main()
