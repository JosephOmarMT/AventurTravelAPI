import express, { json } from 'express'
import { createDestinationRouter } from './routes/destinations.js'
import { corsMiddleware } from './middlewares/cors.js'

export const createApp = ({ destinationModel }) => {
  const app = express()
  app.use(json())
  app.use(corsMiddleware())
  app.disable('x-powered-by')

  app.use('/destinations', createDestinationRouter({ destinationModel }))

  const PORT = process.env.PORT ?? 1235

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}
