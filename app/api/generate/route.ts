import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not configured')
      return NextResponse.json(
        { error: 'AI service not configured. Please set DEEPSEEK_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client with DeepSeek configuration
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    })

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a professional frontend developer. Generate complete, production-ready React/Next.js components based on user requirements. Always include:

1. A complete React component with proper imports
2. Modern, responsive design using Tailwind CSS
3. Proper TypeScript types
4. Clean, maintainable code structure
5. Accessibility considerations

Return the code in the following JSON format:
{
  "files": {
    "src/App.tsx": "// Complete React component code here",
    "src/index.css": "// CSS styles here",
    "package.json": "// Package.json content here"
  },
  "projectName": "descriptive-project-name"
}

Make sure the generated code is immediately runnable and includes all necessary dependencies.`
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ],
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '8000'),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
    })

    const generatedContent = completion.choices[0]?.message?.content

    if (!generatedContent) {
      console.error('Empty response from DeepSeek API')
      return NextResponse.json(
        { error: 'Empty response from AI service' },
        { status: 500 }
      )
    }

    try {
      // Try to extract JSON from markdown code blocks first
      let jsonContent = generatedContent

      // Check if response contains markdown code blocks
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
      const match = generatedContent.match(codeBlockRegex)
      if (match) {
        jsonContent = match[1].trim()
        console.log('Extracted JSON from code block')
      }

      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(jsonContent)
      return NextResponse.json({
        success: true,
        project: parsedResponse
      })
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      console.warn('Failed to parse AI response as JSON, using fallback:', parseError)
      console.warn('Raw response preview:', generatedContent.substring(0, 200) + '...')
      return NextResponse.json({
        success: true,
        project: {
          files: {
            'src/App.tsx': generatedContent,
            'src/index.css': `
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
            `,
            'package.json': JSON.stringify({
              "name": "generated-app",
              "version": "0.1.0",
              "private": true,
              "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1"
              },
              "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
              },
              "eslintConfig": {
                "extends": [
                  "react-app",
                  "react-app/jest"
                ]
              },
              "browserslist": {
                "production": [
                  ">0.2%",
                  "not dead",
                  "not op_mini all"
                ],
                "development": [
                  "last 1 chrome version",
                  "last 1 firefox version",
                  "last 1 safari version"
                ]
              }
            }, null, 2)
          },
          projectName: 'generated-app'
        }
      })
    }
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}

