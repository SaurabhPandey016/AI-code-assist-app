import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCode } from '../staticAnalysis.js';

test('detects obvious issues in JavaScript sample code', () => {
  const result = analyzeCode({
    code: `function greet(name) {
  if (name) {
    console.log('hello');
  }
}

const unusedValue = 42;
const msg = greet();
`,
    filename: 'sample.js',
  });

  assert.equal(result.language, 'javascript');
  assert.ok(result.issues.length >= 2);
  assert.ok(result.metrics.totalFunctions >= 1);
  assert.ok(result.metrics.linesOfCode > 0);
});

test('detects Python-specific issues and complexity markers', () => {
  const result = analyzeCode({
    code: `def compute(x, y):
    if x > 0:
        if y > 0:
            return x + y
    return 0
`,
    filename: 'sample.py',
  });

  assert.equal(result.language, 'python');
  assert.ok(result.metrics.totalFunctions >= 1);
  assert.ok(result.metrics.complexityScore >= 1);
});
