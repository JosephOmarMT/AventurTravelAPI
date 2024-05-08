import pgPromise from 'pg-promise'
import { config } from 'dotenv'

config()

const pgp = pgPromise({})

const cliente = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})

export class DestinationModel {
  static async getAll ({ sectionPrimary, sectionSecondary }) {
    try {
      let queryString = `
      SELECT
        d.destination_id,
        d.title,
        d.descriptionTitle AS "descriptionTitle",
        d.slug,
        d.imgSlider AS "imgSlider",
        d.descriptionGeneral AS "descriptionGeneral",
        d.timeTravel AS "timeTravel",
        d.itinerary,
        d.travelDetails AS "travelDetails",
        d.considerations,
        d.additionalServices AS "additionalServices",
        d.imgSliderSecondary AS "imgSliderSecondary",
        d.sectionPrimary AS "sectionPrimary",
        d.sectionSecondary AS "sectionSecondary",
        (
          SELECT json_agg(json_build_object(
              'currency', p.currency,
              'amount', p.amount,
              'includedServices', p.includedServices,
              'notIncludedServices', p.notIncludedServices
          ))
          FROM price p
          WHERE d.destination_id = p.destination_id
          LIMIT 1
        ) AS price,
        json_agg(json_build_object(
          'name', c.name,
          'imgProfile', c.imgProfile,
          'content', c.content,
          'date', c.date
        )) AS comment
      FROM destination d
      LEFT JOIN price p ON d.destination_id = p.destination_id
      LEFT JOIN comment c ON d.destination_id = c.destination_id
      `

      const values = []

      if (sectionPrimary && sectionSecondary) {
        queryString += ' WHERE d.sectionPrimary ILIKE $1 AND d.sectionSecondary ILIKE $2'
        values.push(`%${sectionPrimary}%`, `%${sectionSecondary}%`)
      } else if (sectionPrimary) {
        queryString += ' WHERE d.sectionPrimary ILIKE $1'
        values.push(`%${sectionPrimary}%`)
      } else if (sectionSecondary) {
        queryString += ' WHERE d.sectionSecondary ILIKE $1'
        values.push(`%${sectionSecondary}%`)
      }

      queryString += ' GROUP BY d.destination_id'

      const destinationsWithComments = await cliente.query(queryString, values)

      return destinationsWithComments
    } catch (error) {
      console.error('Error al obtener destinos:', error)
      throw error
    }
  }

  static async getById ({ id }) {
    try {
      const queryString = `
      SELECT
        d.destination_id,
        d.title,
        d.descriptionTitle AS "descriptionTitle",
        d.slug,
        d.imgSlider AS "imgSlider",
        d.descriptionGeneral AS "descriptionGeneral",
        d.timeTravel AS "timeTravel",
        d.itinerary,
        d.travelDetails AS "travelDetails",
        d.considerations,
        d.additionalServices AS "additionalServices",
        d.imgSliderSecondary AS "imgSliderSecondary",
        d.sectionPrimary AS "sectionPrimary",
        d.sectionSecondary AS "sectionSecondary",
        (
          SELECT json_agg(json_build_object(
              'currency', p.currency,
              'amount', p.amount,
              'includedServices', p.includedServices,
              'notIncludedServices', p.notIncludedServices
          ))
          FROM price p
          WHERE d.destination_id = p.destination_id
          LIMIT 1
        ) AS price,
        json_agg(json_build_object(
          'name', c.name,
          'imgProfile', c.imgProfile,
          'content', c.content,
          'date', c.date
        )) AS comment
      FROM destination d
      LEFT JOIN price p ON d.destination_id = p.destination_id
      LEFT JOIN comment c ON d.destination_id = c.destination_id
      WHERE d.destination_id = $1
      GROUP BY d.destination_id
    `

      const destinationsWithComments = await cliente.query(queryString, id)

      return destinationsWithComments
    } catch (error) {
      console.error(`Error al obtener el destino con id: ${id}`, error)
      throw error
    }
  }

  static async create ({ input }) {
    try {
      const {
        title,
        descriptionTitle,
        slug,
        imgSlider,
        descriptionGeneral,
        timeTravel,
        itinerary,
        travelDetails,
        considerations,
        additionalServices,
        imgSliderSecondary,
        sectionPrimary,
        sectionSecondary,
        price,
        comment
      } = input

      const uuidResult = await cliente.query('SELECT uuid_generate_v4()')
      const uuid = uuidResult[0].uuid_generate_v4

      await cliente.query(`
        INSERT INTO destination (destination_id, title, descriptionTitle, slug, imgSlider, descriptionGeneral, timeTravel, itinerary, travelDetails, considerations, additionalServices, imgSliderSecondary, sectionPrimary, sectionSecondary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [uuid, title, descriptionTitle, slug, imgSlider, descriptionGeneral, timeTravel, itinerary, travelDetails, considerations, additionalServices, imgSliderSecondary, sectionPrimary, sectionSecondary])

      if (price && price.length > 0) {
        for (const priceItem of price) {
          const { currency, amount, includedServices, notIncludedServices } = priceItem
          await cliente.query(`
          INSERT INTO price (destination_id, currency, amount, includedServices, notIncludedServices)
          VALUES ($1, $2, $3, $4, $5);
          `, [uuid, currency, amount, includedServices, notIncludedServices])
        }
      }

      // CREANDO LA FECHA ACTUAL
      const now = new Date()
      const monthName = now.toLocaleDateString('en-US', { month: 'short' })
      const formattedDate = `${now.getDate()} ${monthName.toUpperCase()} ${now.getFullYear()} at ${now.toLocaleTimeString('en-US', { hour12: false })}`

      if (comment && comment.length > 0) {
        for (const commentItem of comment) {
          const { name, imgProfile, content } = commentItem
          await cliente.query(`
          INSERT INTO comment (destination_id, name, imgProfile, content, date)
          VALUES ($1, $2, $3, $4, $5);
          `, [uuid, name, imgProfile, content, formattedDate])
        }
      }

      const destination = await cliente.query(
        'SELECT * FROM destination WHERE destination_id = $1',
        [uuid]
      )

      return destination
    } catch (error) {
      console.error('Error al crear el nuevo destino', error)
      throw error
    }
  }

  static async delete ({ id }) {
    try {
      await cliente.query(`
        DELETE FROM comment 
        WHERE destination_id = $1
      `, id)
      await cliente.query(`
        DELETE FROM price 
        WHERE destination_id = $1
      `, id)
      const deleteDestination = await cliente.query(`
        DELETE FROM destination
        WHERE destination_id = $1
        RETURNING destination_id
      `, id)
      const result = deleteDestination.length
      return result
    } catch (error) {
      console.error(`Error al obtener el destino con id: ${id}`, error)
      throw error
    }
  }

  static async update ({ id, input }) {
    try {
      const findDestination = await cliente.query(`
        SELECT * FROM destination WHERE destination_id = $1
      `, id)

      if (findDestination.length === 0) return false

      const {
        title,
        descriptionTitle,
        slug,
        imgSlider,
        descriptionGeneral,
        timeTravel,
        itinerary,
        travelDetails,
        considerations,
        additionalServices,
        imgSliderSecondary,
        sectionPrimary,
        sectionSecondary,
        price,
        comment
      } = input

      const updatedDestination = await cliente.query(
      `
      UPDATE destination
      SET 
        title = COALESCE($1, title),
        descriptionTitle = COALESCE($2, descriptionTitle),
        slug = COALESCE($3, slug),
        imgSlider = COALESCE($4, imgSlider::TEXT[]),
        descriptionGeneral = COALESCE($5, descriptionGeneral),
        timeTravel = COALESCE($6, timeTravel),
        itinerary = COALESCE($7, itinerary::TEXT[]),
        travelDetails = COALESCE($8, travelDetails::TEXT[]),
        considerations = COALESCE($9, considerations::TEXT[]),
        additionalServices = COALESCE($10, additionalServices::TEXT[]),
        imgSliderSecondary = COALESCE($11, imgSliderSecondary::TEXT[]),
        sectionPrimary = COALESCE($12, sectionPrimary),
        sectionSecondary = COALESCE($13, sectionSecondary)
      WHERE destination_id = $14
      RETURNING destination_id
      `, [title, descriptionTitle, slug, imgSlider, descriptionGeneral, timeTravel, itinerary, travelDetails, considerations, additionalServices, imgSliderSecondary, sectionPrimary, sectionSecondary, id]
      )

      if (price && price.length > 0) {
        for (const priceItem of price) {
          const { currency, amount, includedServices, notIncludedServices } = priceItem
          await cliente.query(`
            UPDATE price
            SET
              currency = COALESCE($1, currency),
              amount = COALESCE($2, amount),
              includedServices = COALESCE($3, includedServices::TEXT[]),
              notIncludedServices = COALESCE($4, notIncludedServices::TEXT[])
            WHERE destination_id = $5
          `, [currency, amount, includedServices, notIncludedServices, id])
        }
      }

      if (comment && comment.length > 0) {
        await cliente.query(`
            DELETE FROM comment
            WHERE destination_id = $1
        `, [id])

        for (const commentItem of comment) {
          const { name, imgProfile, content, date } = commentItem
          await cliente.query(`
            INSERT INTO comment (destination_id, name, imgProfile, content, date)
            VALUES ($1, $2, $3, $4, $5);
          `, [id, name, imgProfile, content, date])
        }
      }

      return updatedDestination
    } catch (error) {
      console.error(`Error al obtener el destino con id: ${id}`, error)
      throw error
    }
  }
}
