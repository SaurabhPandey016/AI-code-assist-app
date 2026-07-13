import path from 'node:path';

const LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  cs: 'csharp',
  go: 'go',
  php: 'php',
  rb: 'ruby',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  h: 'c',
  hpp: 'cpp',
  rs: 'rust',
};

function detectLanguage(filename = '') {
  const ext = path.extname(filename).replace('.', '').toLowerCase();
  return LANGUAGE_MAP[ext] || 'unknown';
}

function analyzeCode({ code = '', filename = '' }) {
  const language = detectLanguage(filename);
  const lines = code.split(/\r?\n/);
  const issues = [];
  const trimmed = code.replace(/\s+/g, ' ').trim();

  if (!trimmed) {
    issues.push({
      severity: 'info',
      title: 'Empty submission',
      description: 'No code was provided for analysis.',
    });
  }

  if (language === 'javascript' || language === 'typescript') {
    const hasConsoleLog = /console\.log/.test(code);
    if (hasConsoleLog) {
      issues.push({
        severity: 'info',
        title: 'Debug statement detected',
        description: 'Console logging is present and may be left over from development.',
      });
    }

    if (/\bconst\s+\w+\s*=\s*\d+/.test(code)) {
      issues.push({
        severity: 'warning',
        title: 'Possible unused constant',
        description: 'A constant is declared but not used in the sample.',
      });
    }
  }

  if (language === 'python') {
    const functionMatches = code.match(/def\s+\w+/g) || [];
    if (functionMatches.length > 0) {
      issues.push({
        severity: 'info',
        title: 'Function-based structure detected',
        description: 'The snippet uses functions, which is a good sign for maintainability.',
      });
    }
  }

  const complexityScore = Math.max(1, (code.match(/if\s*\(/g) || []).length + (code.match(/for\s+/g) || []).length + (code.match(/while\s+/g) || []).length + 1);
  const totalFunctions = (code.match(/function\s+\w+/g) || []).length + (code.match(/def\s+\w+/g) || []).length;

  return {
    language,
    issues,
    metrics: {
      linesOfCode: lines.length,
      totalFunctions,
      complexityScore,
      fileName: filename,
    },
  };
}

export { analyzeCode, detectLanguage };
