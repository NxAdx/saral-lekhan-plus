/**
 * Shared Editor CSS Template
 * 
 * Generates the CSS styles injected into the RichEditor WebView.
 * Used by both new.tsx and [id].tsx to keep editor styling in sync.
 */

interface EditorCssParams {
  fontSans?: string;
  fontSansBold?: string;
  fontSansSemi?: string;
  fontMono?: string;
  fontSize: number;
  colorBg: string;
  colorBgRaised: string;
  colorInk: string;
  colorInkMid: string;
  colorInkDim: string;
  colorAccent: string;
  colorStroke: string;
}

export function buildEditorCss(params: EditorCssParams): string {
  const {
    fontSans = 'sans-serif',
    fontSansBold = 'sans-serif',
    fontSansSemi = 'sans-serif',
    fontMono = 'monospace',
    fontSize, colorBg, colorBgRaised, colorInk, colorInkMid,
    colorInkDim, colorAccent, colorStroke,
  } = params;

  return `
    body {
      font-family: '${fontSans}', -apple-system, Roboto, Helvetica, Arial, sans-serif;
      font-size: ${16 * fontSize}px;
      line-height: ${Math.round(26 * fontSize)}px;
      padding: 0;
      margin: 0;
      background-color: ${colorBg};
      color: ${colorInkMid};
    }
    h1 {
      font-family: '${fontSansBold}', -apple-system, Roboto, Helvetica, Arial, sans-serif !important;
      font-weight: 900 !important;
      font-size: ${32 * fontSize}px !important;
      color: ${colorInk};
      line-height: ${Math.round(40 * fontSize)}px !important;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    h2 {
      font-family: '${fontSansBold}', -apple-system, Roboto, Helvetica, Arial, sans-serif !important;
      font-weight: 800 !important;
      font-size: ${24 * fontSize}px !important;
      color: ${colorInk};
      line-height: ${Math.round(32 * fontSize)}px !important;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    blockquote {
      border-left: 4px solid ${colorAccent};
      padding-left: 12px;
      font-style: italic;
      color: ${colorInkDim};
      margin: 10px 0;
    }
    pre {
      position: relative;
      background-color: ${colorBgRaised};
      border: 1px solid ${colorStroke};
      border-left: 4px solid ${colorAccent};
      color: ${colorInk};
      padding: 38px 16px 14px;
      border-radius: 16px;
      font-family: '${fontMono}', monospace;
      font-size: ${14 * fontSize}px;
      line-height: ${Math.round(22 * fontSize)}px;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    pre::before {
      content: 'CODE';
      position: absolute;
      top: 10px;
      left: 12px;
      color: ${colorAccent};
      background-color: ${colorAccent}18;
      border: 1px solid ${colorAccent}44;
      border-radius: 999px;
      padding: 3px 8px;
      font-family: '${fontSansSemi}', sans-serif;
      font-size: ${10 * fontSize}px;
      letter-spacing: 1px;
    }
    code {
      background-color: ${colorBgRaised};
      color: ${colorInk};
      border-radius: 6px;
      padding: 2px 4px;
      font-family: '${fontMono}', monospace;
      font-size: ${14 * fontSize}px;
    }
    pre code {
      display: block;
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: inherit;
      white-space: pre-wrap;
    }
    hr {
      border: 0;
      border-top: 1px solid ${colorStroke};
      margin: 20px 0;
    }
    ul, ol {
      padding-left: 20px;
      font-size: 1em !important;
      margin: 10px 0;
    }
    li {
      font-size: 1em !important;
      margin: 6px 0;
    }
    .x-todo {
      padding-left: 0 !important;
      margin: 12px 0;
    }
    .x-todo li {
      list-style: none;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding-left: 0;
    }
    .x-todo-box {
      position: static !important;
      left: 0 !important;
      display: inline-flex;
      width: 20px;
      min-width: 20px;
      height: 20px;
      align-items: center;
      justify-content: center;
      margin-top: 3px;
    }
    .x-todo-box input {
      position: static !important;
      width: 18px;
      height: 18px;
      margin: 0;
      accent-color: ${colorAccent};
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: 16px;
      margin: 12px 0;
    }
  `;
}
