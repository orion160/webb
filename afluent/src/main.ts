import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import otelSDK from './instrumentation'

const bootstrap = async () => {
  otelSDK.start()
  console.log('Started OTEL SDK')

  const app = await NestFactory.create(AppModule)

  app.enableShutdownHooks()

  // TODO be picky on CORS origins on production
  app.enableCors({ origin: '*' })

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
