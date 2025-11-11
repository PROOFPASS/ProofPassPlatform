/**
 * OpenTelemetry Configuration
 * Complete observability setup with traces, metrics, and logs
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  enableTracing: boolean;
  enableMetrics: boolean;
  sampleRate: number;
}

const defaultConfig: TelemetryConfig = {
  serviceName: process.env.SERVICE_NAME || 'proofpass-api',
  serviceVersion: process.env.SERVICE_VERSION || '0.1.0',
  environment: process.env.NODE_ENV || 'development',
  jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
  enableTracing: process.env.ENABLE_TRACING !== 'false',
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  sampleRate: parseFloat(process.env.TRACE_SAMPLE_RATE || '1.0'),
};

let sdk: NodeSDK | null = null;

export function initializeTelemetry(config: Partial<TelemetryConfig> = {}): NodeSDK {
  const telemetryConfig = { ...defaultConfig, ...config };

  // Resource attributes (service metadata)
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: telemetryConfig.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: telemetryConfig.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: telemetryConfig.environment,
  });

  const instrumentations = [
    // Auto-instrumentations for common libraries
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable FS instrumentation (too noisy)
      },
    }),
    // Fastify specific instrumentation
    new FastifyInstrumentation(),
    // HTTP instrumentation
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (req) => {
        // Ignore health checks and metrics endpoints
        const url = req.url || '';
        return url.includes('/health') || url.includes('/metrics');
      },
    }),
    // Redis instrumentation
    new IORedisInstrumentation(),
    // PostgreSQL instrumentation
    new PgInstrumentation({
      enhancedDatabaseReporting: true,
    }),
  ];

  const spanProcessors = [];
  const metricReaders = [];

  // Tracing: Jaeger Exporter
  if (telemetryConfig.enableTracing && telemetryConfig.jaegerEndpoint) {
    const jaegerExporter = new JaegerExporter({
      endpoint: telemetryConfig.jaegerEndpoint,
    });
    spanProcessors.push(new BatchSpanProcessor(jaegerExporter));
  }

  // Metrics: Prometheus Exporter
  if (telemetryConfig.enableMetrics) {
    const prometheusExporter = new PrometheusExporter({
      port: telemetryConfig.prometheusPort,
    }, () => {
      console.log(`📊 Prometheus metrics available at http://localhost:${telemetryConfig.prometheusPort}/metrics`);
    });

    metricReaders.push(
      new PeriodicExportingMetricReader({
        exporter: prometheusExporter,
        exportIntervalMillis: 10000, // Export every 10 seconds
      })
    );
  }

  // Initialize SDK
  sdk = new NodeSDK({
    resource,
    instrumentations,
    spanProcessors,
    metricReader: metricReaders[0], // Prometheus reader
  });

  // Start SDK
  sdk.start();

  console.log('✅ OpenTelemetry initialized successfully');
  console.log(`   Service: ${telemetryConfig.serviceName}`);
  console.log(`   Version: ${telemetryConfig.serviceVersion}`);
  console.log(`   Environment: ${telemetryConfig.environment}`);
  if (telemetryConfig.enableTracing) {
    console.log(`   Tracing: Enabled (Jaeger: ${telemetryConfig.jaegerEndpoint})`);
  }
  if (telemetryConfig.enableMetrics) {
    console.log(`   Metrics: Enabled (Prometheus: http://localhost:${telemetryConfig.prometheusPort}/metrics)`);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await sdk?.shutdown();
    console.log('🔌 OpenTelemetry shut down successfully');
  });

  return sdk;
}

export function getTelemetrySDK(): NodeSDK | null {
  return sdk;
}

export function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}
