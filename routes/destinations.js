import { Router } from 'express'
import { DestinationController } from '../controllers/destinations.js'

export const createDestinationRouter = ({ destinationModel }) => {
  const destinationRouter = Router()

  const destinationController = new DestinationController({ destinationModel })

  destinationRouter.get('/', destinationController.getAll)
  destinationRouter.get('/:id', destinationController.getById)
  destinationRouter.post('/', destinationController.create)
  destinationRouter.delete('/:id', destinationController.delete)
  destinationRouter.patch('/:id', destinationController.update)

  return destinationRouter
}
