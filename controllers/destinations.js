import { validateDestination, validatePartialDestination } from '../schemas/destinations.js'

export class DestinationController {
  constructor ({ destinationModel }) {
    this.destinationModel = destinationModel
  }

  getAll = async (req, res) => {
    const { sectionPrimary } = req.query
    const { sectionSecondary } = req.query
    const destination = await this.destinationModel.getAll({ sectionPrimary, sectionSecondary })
    res.json(destination)
  }

  getById = async (req, res) => {
    const { id } = req.params
    const destination = await this.destinationModel.getById({ id })
    if (destination && destination.length > 0) return res.json(destination)
    res.status(404).json({ message: 'Destination not found' })
  }

  create = async (req, res) => {
    const result = validateDestination(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newDestination = await this.destinationModel.create({ input: result.data })

    res.status(201).json(newDestination)
  }

  delete = async (req, res) => {
    const { id } = req.params
    const result = await this.destinationModel.delete({ id })
    if (result === 0) return res.status(404).json({ message: 'Destination not found' })
    res.json({ message: 'Destination deleted' })
  }

  update = async (req, res) => {
    const result = validatePartialDestination(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.errors) })
    }

    const { id } = req.params

    const updateDestination = await this.destinationModel.update({ id, input: result.data })
    console.log(updateDestination)
    if (!updateDestination) return res.status(404).json({ message: 'Destination not found' })
    return res.json(updateDestination)
  }
}
