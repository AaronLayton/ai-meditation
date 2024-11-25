'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!
const VOICE_ID = process.env.VOICE_ID!

export async function generateMeditation(prompt: string) {
  'use server'
  try {
    console.log('Starting meditation generation with prompt:', prompt)
    // gemini-exp-1121 is the latest model
    // gemini-1.5-flash-8b is a quicker model
    const model = genAI.getGenerativeModel({ model: 'gemini-exp-1121' })
    
    const duration = extractDuration(prompt)
    console.log('Extracted duration:', duration)
    
    const result = await model.generateContent(`


Generate it with:
1. A short subtle title (prefix with "TITLE:")
2. The meditation script itself (prefix with "MEDITATION:")

Guidelines for the meditation:
- Structure the meditation in clear sections/thoughts
- Be mindful of the language asked for e.g. english, czech, etc.
- Keep the actual spoken content brief (about 60-90 seconds total)
- Use breaks for silence, but never write "(pause)" or any text about pausing:
  - Use <break time="1.0s" /> for natural breathing pauses between sentences
  - Use <break time="3.0s" /> <break time="3.0s" /> at the end of thoughts
  - For meditation periods use multiple 3-second breaks:
    - Short meditation period: <break time="3.0s" /> <break time="3.0s" /> <break time="3.0s" />
    - Long meditation period: <break time="3.0s" /> <break time="3.0s" /> <break time="3.0s" /> <break time="3.0s" /> <break time="3.0s" /> <break time="3.0s" />
- Keep sentences short and purposeful
- If its 1 or 2 minutes long there can be a fair amount of guidance given.
- For longer meditations, include 2-3 extended meditation periods with minimal guidance
- For longer meditations (5+ minutes), use more and longer sequences of breaks rather than more speaking
- This a meditation so we are not trying to teach anything, we are just guiding the user through a meditation with prompts.


Generate a meditation based on this prompt: "${prompt}"
Duration: ${duration} minutes
`)
    
    const response = await result.response
    const fullText = response.text()
    
    // Split the response into title and meditation
    const titleMatch = fullText.match(/TITLE:([^]*?)MEDITATION:/);
    const meditationText = fullText.split('MEDITATION:')[1]?.trim() || fullText
    const title = titleMatch?.[1]?.trim() || 'Mindful Moment'
    
    console.log('Generated meditation text:', meditationText)
    
    console.log('Starting speech generation with Elevenlabs')
    const audioBuffer = await generateSpeech(meditationText)
    console.log('Speech generation complete, buffer size:', audioBuffer.length)
    
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    console.log('Audio converted to base64')
    
    return { 
      success: true, 
      title: title,
      meditation: meditationText,
      audioContent: base64Audio 
    }
  } catch (error) {
    console.error('Error in generateMeditation:', error)
    return { success: false, error: 'Failed to generate meditation. Please try again.' }
  }
}

async function generateSpeech(text: string): Promise<Buffer> {
  try {
    console.log('Making request to Elevenlabs API')
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.3,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          }
        }),
      }
    )

    if (!response.ok) {
      console.error('Elevenlabs API error:', response.status, response.statusText)
      throw new Error(`Elevenlabs API error: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    console.log('Successfully received audio buffer from Elevenlabs')
    return buffer
  } catch (error) {
    console.error('Error in generateSpeech:', error)
    throw error
  }
}

function extractDuration(prompt: string): number {
  // Extract number of minutes from prompt (e.g., "5-minute", "five minute", etc.)
  const minuteMatches = prompt.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[- ]minute/i)
  if (!minuteMatches) return 5 // default to 5 minutes
  
  const numberMap: { [key: string]: number } = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  }
  
  const duration = numberMap[minuteMatches[1].toLowerCase()] || parseInt(minuteMatches[1])
  
  // Clamp duration between 1 and 10 minutes
  return Math.min(Math.max(duration, 1), 10)
}

