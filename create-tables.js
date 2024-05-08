import pgPromise from 'pg-promise'
import { config } from 'dotenv'

config()

const pgp = pgPromise()

const createTables = async () => {
  const client = pgp({
    connectionString: process.env.DATABASE_URL,
    ssl: true
  })

  try {
    const createTablesQuery = `
    CREATE EXTENSION "uuid-ossp";

      CREATE TABLE destination (
      destination_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      title VARCHAR(50) NOT NULL,
      descriptionTitle VARCHAR(100) NOT NULL,
      slug VARCHAR(50) NOT NULL,
      imgSlider TEXT[] NOT NULL,
      descriptionGeneral TEXT NOT NULL,
      timeTravel VARCHAR(20) NOT NULL,
      itinerary TEXT[] NOT NULL,
      travelDetails TEXT[] NOT NULL,
      considerations TEXT[] NOT NULL,
      additionalServices TEXT[] NOT NULL,
      imgSliderSecondary TEXT[] NOT NULL,
      sectionPrimary VARCHAR(50) NOT NULL,
      sectionSecondary VARCHAR(50) DEFAULT ' '
      );

      CREATE TABLE price (
      price_id SERIAL PRIMARY KEY,
      currency VARCHAR(5) NOT NULL,
      amount INTEGER NOT NULL,
      includedServices VARCHAR(50)[] NOT NULL,
      notIncludedServices VARCHAR(50)[] NOT NULL,
      destination_id UUID REFERENCES destination(destination_id)
      );

      CREATE TABLE comment (
      commend_id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      imgProfile TEXT NOT NULL,
      content TEXT NOT NULL,
      date TIMESTAMP DEFAULT (to_timestamp(to_char(current_timestamp, 'DD Mon YYYY HH24:MI:SS'), 'DD Mon YYYY HH24:MI:SS')),
      destination_id UUID REFERENCES destination(destination_id)
      );
    `

    await client.none(createTablesQuery)
    console.log('Tablas creadas exitosamente')
  } catch (error) {
    console.error('Error al crear las tablas:', error)
  } finally {
    pgp.end()
  }
}

createTables()
