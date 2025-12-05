import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

async function callDeepSeekAPI(prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
          content: `You are a professional frontend developer. Generate a COMPLETE React component based on user requirements.

CRITICAL: Return ONLY the complete React component code - NO imports, NO exports, just the function body. The code will be executed in an environment with React, Tailwind CSS, and common icon components already available.

Requirements:
1. Use 'function App()' or 'const App = () =>' syntax
2. Include ALL component logic and JSX
3. Use Tailwind CSS classes for styling
4. Use provided icon components: Play, Pause, RotateCcw, Trophy, Target, Zap, Sparkles, Mail, Lock, User, AlertCircle, Check, Calendar, Clock, ArrowRight, Star, Rocket, Shield
5. Make it visually appealing and responsive
6. NO truncation - complete code only

Example format:
function App() {
  const [state, setState] = React.useState(initialValue);
  return (
    <div className="container mx-auto p-4">
      {/* Complete JSX here */}
    </div>
  );
}`
      },
      {
        role: 'user',
        content: prompt.trim()
      }
    ],
    max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from DeepSeek API')
  }

  return content
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const appContent = await callDeepSeekAPI(prompt.trim())

    if (!appContent || appContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not generate preview' },
        { status: 500 }
      )
    }

    // Create a simple HTML preview without external dependencies
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App - Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide-react@0.263.1/umd/lucide-react.js"></script>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        min-height: 100vh;
      }

      .preview-container {
        width: 100%;
        min-height: 100vh;
        position: relative;
      }

      .preview-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        padding: 12px 20px;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        color: #374151;
      }

      .preview-badge {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 500;
        font-size: 12px;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: #6b7280;
        text-align: center;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error {
        max-width: 600px;
        margin: 40px auto;
        padding: 24px;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
        border-radius: 12px;
        border: 1px solid #fca5a5;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .error h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .error p {
        margin: 8px 0;
        line-height: 1.5;
      }

      .error-details {
        background: rgba(255, 255, 255, 0.5);
        padding: 12px;
        border-radius: 6px;
        margin-top: 16px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
        word-break: break-all;
      }

      .success-message {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-weight: 500;
        opacity: 0;
        transform: translateY(100px);
        transition: all 0.3s ease;
        z-index: 1000;
      }

      .success-message.show {
        opacity: 1;
        transform: translateY(0);
      }
    </style>
  </head>
  <body>
    <div class="preview-header">
      <div class="preview-badge">🔴 Live Preview</div>
      <div style="font-size: 12px; color: #6b7280;">
        Generated by AI • Interactive Preview
      </div>
    </div>

    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Generating Preview...</div>
      <div style="font-size: 14px; color: #9ca3af;">Compiling React component</div>
    </div>

    <div id="root" class="preview-container" style="display: none; padding-top: 60px;"></div>

    <div id="success-message" class="success-message">
      ✨ Preview loaded successfully!
    </div>
    
    <script type="text/babel">
      // Enhanced icon components using Lucide React
      const IconComponent = ({ name, className = "w-4 h-4", ...props }) => {
        try {
          // Try to use Lucide React icons first
          if (window.lucideReact && window.lucideReact[name]) {
            const IconComp = window.lucideReact[name];
            return React.createElement(IconComp, {
              className: className,
              ...props
            });
          }
        } catch (e) {
          console.log('Lucide icon not available, using fallback');
        }

        // Fallback to Unicode symbols
        const icons = {
          play: "▶",
          pause: "⏸",
          rotate: "🔄",
          trophy: "🏆",
          target: "🎯",
          zap: "⚡",
          sparkles: "✨",
          mail: "✉",
          lock: "🔒",
          user: "👤",
          alert: "⚠",
          check: "✓",
          calendar: "📅",
          clock: "🕐",
          arrow: "→",
          star: "⭐",
          rocket: "🚀",
          shield: "🛡",
          copy: "📋",
          download: "⬇",
          eye: "👁"
        };

        return React.createElement('span', {
          className: className + " inline-block",
          ...props
        }, icons[name] || "?");
      };

      // Create icon components with Lucide support
      const Play = (props) => React.createElement(IconComponent, { name: 'Play', ...props });
      const Pause = (props) => React.createElement(IconComponent, { name: 'Pause', ...props });
      const RotateCcw = (props) => React.createElement(IconComponent, { name: 'RotateCcw', ...props });
      const Trophy = (props) => React.createElement(IconComponent, { name: 'Trophy', ...props });
      const Target = (props) => React.createElement(IconComponent, { name: 'Target', ...props });
      const Zap = (props) => React.createElement(IconComponent, { name: 'Zap', ...props });
      const Sparkles = (props) => React.createElement(IconComponent, { name: 'Sparkles', ...props });
      const Mail = (props) => React.createElement(IconComponent, { name: 'Mail', ...props });
      const Lock = (props) => React.createElement(IconComponent, { name: 'Lock', ...props });
      const User = (props) => React.createElement(IconComponent, { name: 'User', ...props });
      const AlertCircle = (props) => React.createElement(IconComponent, { name: 'AlertCircle', ...props });
      const Check = (props) => React.createElement(IconComponent, { name: 'Check', ...props });
      const Calendar = (props) => React.createElement(IconComponent, { name: 'Calendar', ...props });
      const Clock = (props) => React.createElement(IconComponent, { name: 'Clock', ...props });
      const ArrowRight = (props) => React.createElement(IconComponent, { name: 'ArrowRight', ...props });
      const Star = (props) => React.createElement(IconComponent, { name: 'Star', ...props });
      const Rocket = (props) => React.createElement(IconComponent, { name: 'Rocket', ...props });
      const Shield = (props) => React.createElement(IconComponent, { name: 'Shield', ...props });
      
      try {
        // Clean up the component code
        let cleanCode = \`${appContent
          .replace(/export\s+default\s+/g, '') // Remove export default
          .replace(/import\s+.*?\s+from\s+['"`].*?['"`];?\s*\n/g, '') // Remove all import statements
          .replace(/import\s*\(\s*['"`].*?['"`]\s*\);?\s*\n/g, '') // Remove dynamic imports
          .replace(/const\s+\w+\s*=\s*require\s*\(['"`].*?['"`]\);?\s*\n/g, '') // Remove require statements
          .replace(/useState/g, 'React.useState') // Ensure React hooks are available
          .replace(/useEffect/g, 'React.useEffect')
          .replace(/useCallback/g, 'React.useCallback')
          .replace(/useMemo/g, 'React.useMemo')
          .replace(/useRef/g, 'React.useRef')
          .replace(/useContext/g, 'React.useContext')
          .replace(/\$\{/g, '\\${') // Escape template literals
          .replace(/\`/g, '\\`') // Escape backticks
          .trim()}\`;

        // Ensure the code starts with a proper function declaration
        if (!cleanCode.includes('function App') && !cleanCode.includes('const App =') && !cleanCode.includes('App = ')) {
          cleanCode = \`function App() {\n\${cleanCode}\n}\`;
        }
        
        // Execute the component code
        eval(cleanCode);
        
        // Hide loading and show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('root').style.display = 'block';

        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));

        // Show success message
        setTimeout(() => {
          const successMsg = document.getElementById('success-message');
          if (successMsg) {
            successMsg.classList.add('show');
            setTimeout(() => {
              successMsg.classList.remove('show');
            }, 3000);
          }
        }, 500);

      } catch (error) {
        console.error('Preview error:', error);
        document.getElementById('loading').innerHTML = \`
          <div class="error">
            <h3>❌ Preview Error</h3>
            <p><strong>Could not render the preview:</strong></p>
            <p>\${error.message}</p>
            <div class="error-details">
              <strong>Possible causes:</strong><br>
              • Complex dependencies not supported in preview<br>
              • Advanced React features not available<br>
              • Syntax errors in generated code<br>
              • Missing icon components
            </div>
            <p style="margin-top: 16px; font-size: 14px; color: #7f1d1d;">
              💡 Try simplifying your component or check the generated code for errors.
            </p>
          </div>
        \`;
      }
    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
