import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NetInstrumentation } from '@opentelemetry/instrumentation-net'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import {
  CompositePropagator,
  W3CTraceContextPropagator,
  W3CBaggagePropagator,
} from '@opentelemetry/core'
import {
  envDetector,
  hostDetector,
  processDetector,
  osDetector,
} from '@opentelemetry/resources'

// TODO: put this behind an environment variable
const otel_endpoint = 'http://otel-collector:4317'

const metricExporter = new OTLPMetricExporter({
  url: otel_endpoint,
})

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
})

const traceExporter = new OTLPTraceExporter({
  url: otel_endpoint,
})

const spanProcessor = new BatchSpanProcessor(traceExporter)

const propagator = new CompositePropagator({
  propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
})

const otelSDK = new NodeSDK({
  metricReader: metricReader,
  spanProcessors: [spanProcessor],
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [
    new NetInstrumentation(),
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
  ],
  textMapPropagator: propagator,
  autoDetectResources: true,
  resourceDetectors: [envDetector, hostDetector, processDetector, osDetector],
  serviceName: 'afluent:nestjs',
})

export default otelSDK

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0))
})
