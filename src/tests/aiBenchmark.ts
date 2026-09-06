/**
 * AI Benchmark Suite for Phase 15
 * 
 * Benchmarks the local Ollama AI pipeline for performance metrics.
 * Measures latency, throughput, memory usage, and accuracy.
 */

import { OllamaService } from '../services/ollamaService';
import { AnalysisService } from '../services/analysisService';
import { CandidateAnalysisService } from '../services/candidateAnalysisService';
import { CareGapService } from '../services/careGapService';
import type { MedicalEvent, Pattern } from '../types';

export interface BenchmarkResult {
  testId: string;
  testName: string;
  category: 'latency' | 'throughput' | 'memory' | 'accuracy';
  metric: number;
  unit: string;
  threshold: number;
  passed: boolean;
  timestamp: string;
}

export interface BenchmarkSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  avgLatency: number;
  avgThroughput: number;
  avgMemory: number;
  avgAccuracy: number;
  recommendations: string[];
}

/**
 * Benchmark 1: Single Generation Latency
 * Measures time to generate a response from Ollama
 */
export async function benchmarkSingleGenerationLatency(
  ollamaService: OllamaService,
  testPrompt: string
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    await ollamaService.generate(testPrompt);
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      testId: 'bench-1',
      testName: 'Single Generation Latency',
      category: 'latency',
      metric: latency,
      unit: 'ms',
      threshold: 5000, // 5 seconds max acceptable
      passed: latency <= 5000,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-1',
      testName: 'Single Generation Latency',
      category: 'latency',
      metric: -1,
      unit: 'ms',
      threshold: 5000,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 2: Batch Generation Throughput
 * Measures generations per second for multiple prompts
 */
export async function benchmarkBatchThroughput(
  ollamaService: OllamaService,
  testPrompts: string[]
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  let totalGenerations = 0;
  
  try {
    for (const prompt of testPrompts) {
      await ollamaService.generate(prompt);
      totalGenerations++;
    }
    const endTime = performance.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const throughput = totalGenerations / durationSeconds;
    
    return {
      testId: 'bench-2',
      testName: 'Batch Generation Throughput',
      category: 'throughput',
      metric: throughput,
      unit: 'gens/sec',
      threshold: 0.2, // 0.2 generations per second minimum
      passed: throughput >= 0.2,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-2',
      testName: 'Batch Generation Throughput',
      category: 'throughput',
      metric: -1,
      unit: 'gens/sec',
      threshold: 0.2,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 3: Pattern Detection Latency
 * Measures time to detect patterns from events
 */
export async function benchmarkPatternDetectionLatency(
  analysisService: AnalysisService,
  events: MedicalEvent[]
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    await analysisService.analyzePatient(
      'benchmark-patientId',
      events,
      [],
      'Benchmark test'
    );
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      testId: 'bench-3',
      testName: 'Pattern Detection Latency',
      category: 'latency',
      metric: latency,
      unit: 'ms',
      threshold: 10000, // 10 seconds max acceptable
      passed: latency <= 10000,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-3',
      testName: 'Pattern Detection Latency',
      category: 'latency',
      metric: -1,
      unit: 'ms',
      threshold: 10000,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 4: Candidate Analysis Latency
 * Measures time to analyze candidate conditions
 */
export async function benchmarkCandidateAnalysisLatency(
  candidateAnalysisService: CandidateAnalysisService,
  events: MedicalEvent[],
  patterns: Pattern[]
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    await candidateAnalysisService.analyzeCandidates(
      'benchmark-patientId',
      events,
      patterns
    );
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      testId: 'bench-4',
      testName: 'Candidate Analysis Latency',
      category: 'latency',
      metric: latency,
      unit: 'ms',
      threshold: 15000, // 15 seconds max acceptable
      passed: latency <= 15000,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-4',
      testName: 'Candidate Analysis Latency',
      category: 'latency',
      metric: -1,
      unit: 'ms',
      threshold: 15000,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 5: Memory Usage Estimation
 * Estimates memory usage during analysis
 */
export async function benchmarkMemoryUsage(
  analysisService: AnalysisService,
  events: MedicalEvent[]
): Promise<BenchmarkResult> {
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
  
  try {
    await analysisService.analyzePatient(
      'benchmark-patientId',
      events,
      [],
      'Memory benchmark'
    );
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);
    
    return {
      testId: 'bench-5',
      testName: 'Memory Usage During Analysis',
      category: 'memory',
      metric: memoryUsedMB,
      unit: 'MB',
      threshold: 500, // 500MB max acceptable
      passed: memoryUsedMB <= 500,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-5',
      testName: 'Memory Usage During Analysis',
      category: 'memory',
      metric: -1,
      unit: 'MB',
      threshold: 500,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 6: Ollama Model Availability
 * Checks if Ollama model is available and responsive
 */
export async function benchmarkOllamaAvailability(
  ollamaService: OllamaService
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    const available = await ollamaService.isAvailable();
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      testId: 'bench-6',
      testName: 'Ollama Model Availability',
      category: 'latency',
      metric: latency,
      unit: 'ms',
      threshold: 1000, // 1 second max for availability check
      passed: available && latency <= 1000,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-6',
      testName: 'Ollama Model Availability',
      category: 'latency',
      metric: -1,
      unit: 'ms',
      threshold: 1000,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 7: Care Gap Detection Latency
 * Measures time to detect care gaps
 */
export async function benchmarkCareGapLatency(
  careGapService: CareGapService,
  events: MedicalEvent[],
  patterns: Pattern[]
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    careGapService.analyzeCareGaps('benchmark-patientId', events, patterns);
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      testId: 'bench-7',
      testName: 'Care Gap Detection Latency',
      category: 'latency',
      metric: latency,
      unit: 'ms',
      threshold: 5000, // 5 seconds max acceptable
      passed: latency <= 5000,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-7',
      testName: 'Care Gap Detection Latency',
      category: 'latency',
      metric: -1,
      unit: 'ms',
      threshold: 5000,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Benchmark 8: Full Pipeline Latency
 * Measures end-to-end latency for complete analysis
 */
export async function benchmarkFullPipelineLatency(
  analysisService: AnalysisService,
  candidateAnalysisService: CandidateAnalysisService,
  careGapService: CareGapService,
  events: MedicalEvent[],
  patterns: Pattern[]
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  try {
    // Step 1: Pattern analysis
    await analysisService.analyzePatient('benchmark-patientId', events, patterns, '');
    
    // Step 2: Candidate analysis
    await candidateAnalysisService.analyzeCandidates('benchmark-patientId', events, patterns);
    
    // Step 3: Care gap detection
    careGapService.analyzeCareGaps('benchmark-patientId', events, patterns);
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      testId: 'bench-8',
      testName: 'Full Pipeline Latency',
      category: 'latency',
      metric: latency,
      unit: 'ms',
      threshold: 30000, // 30 seconds max for full pipeline
      passed: latency <= 30000,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId: 'bench-8',
      testName: 'Full Pipeline Latency',
      category: 'latency',
      metric: -1,
      unit: 'ms',
      threshold: 30000,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run complete benchmark suite
 */
export async function runBenchmarkSuite(
  testDocuments: string[],
  testEvents: MedicalEvent[],
  testPatterns: Pattern[]
): Promise<{
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
}> {
  const ollamaService = OllamaService.getInstance();
  const analysisService = AnalysisService.getInstance();
  const candidateAnalysisService = CandidateAnalysisService.getInstance();
  const careGapService = CareGapService.getInstance();
  
  const results: BenchmarkResult[] = [];
  
  // Run benchmarks
  results.push(await benchmarkOllamaAvailability(ollamaService));
  
  if (testDocuments.length > 0) {
    results.push(await benchmarkSingleGenerationLatency(ollamaService, testDocuments[0]));
    results.push(await benchmarkBatchThroughput(ollamaService, testDocuments));
  }
  
  if (testEvents.length > 0) {
    results.push(await benchmarkPatternDetectionLatency(analysisService, testEvents));
    results.push(await benchmarkMemoryUsage(analysisService, testEvents));
    results.push(await benchmarkCandidateAnalysisLatency(candidateAnalysisService, testEvents, testPatterns));
    results.push(await benchmarkCareGapLatency(careGapService, testEvents, testPatterns));
    results.push(await benchmarkFullPipelineLatency(analysisService, candidateAnalysisService, careGapService, testEvents, testPatterns));
  }
  
  // Calculate summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  const latencyResults = results.filter(r => r.category === 'latency' && r.metric > 0);
  const avgLatency = latencyResults.length > 0
    ? latencyResults.reduce((sum, r) => sum + r.metric, 0) / latencyResults.length
    : 0;
  
  const throughputResults = results.filter(r => r.category === 'throughput' && r.metric > 0);
  const avgThroughput = throughputResults.length > 0
    ? throughputResults.reduce((sum, r) => sum + r.metric, 0) / throughputResults.length
    : 0;
  
  const memoryResults = results.filter(r => r.category === 'memory' && r.metric > 0);
  const avgMemory = memoryResults.length > 0
    ? memoryResults.reduce((sum, r) => sum + r.metric, 0) / memoryResults.length
    : 0;
  
  // Accuracy is derived from passed tests
  const avgAccuracy = passedTests / totalTests;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (avgLatency > 10000) {
    recommendations.push('Consider optimizing Ollama model or using a smaller model for faster inference');
  }
  
  if (avgThroughput < 0.5) {
    recommendations.push('Batch processing throughput is below threshold; consider parallel processing');
  }
  
  if (avgMemory > 300) {
    recommendations.push('Memory usage is high; consider streaming results or reducing context window');
  }
  
  if (avgAccuracy < 0.8) {
    recommendations.push('Overall accuracy is below 80%; review failed benchmarks and optimize');
  }
  
  if (results.some(r => r.testId === 'bench-6' && !r.passed)) {
    recommendations.push('Ollama model is not available; ensure Ollama service is running');
  }
  
  return {
    results,
    summary: {
      totalTests,
      passedTests,
      failedTests,
      avgLatency,
      avgThroughput,
      avgMemory,
      avgAccuracy,
      recommendations,
    },
  };
}

/**
 * Print benchmark results to console
 */
export function printBenchmarkResults(
  results: BenchmarkResult[],
  summary: BenchmarkSummary
): void {
  console.log('\n=== AI Pipeline Benchmark Results ===\n');
  
  console.log('Summary:');
  console.log(`  Total Tests: ${summary.totalTests}`);
  console.log(`  Passed: ${summary.passedTests}`);
  console.log(`  Failed: ${summary.failedTests}`);
  console.log(`  Pass Rate: ${(summary.avgAccuracy * 100).toFixed(1)}%`);
  console.log(`  Avg Latency: ${summary.avgLatency.toFixed(0)}ms`);
  console.log(`  Avg Throughput: ${summary.avgThroughput.toFixed(2)} events/sec`);
  console.log(`  Avg Memory: ${summary.avgMemory.toFixed(0)}MB`);
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const metric = result.metric >= 0 ? result.metric.toFixed(2) : 'ERROR';
    console.log(`  ${status} | ${result.testName}: ${metric} ${result.unit} (threshold: ${result.threshold} ${result.unit})`);
  });
  
  if (summary.recommendations.length > 0) {
    console.log('\nRecommendations:');
    summary.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n=== End Benchmark Results ===\n');
}
