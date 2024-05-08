import z from 'zod'

const destinationsSchema = z.object({
  title: z.string(),
  descriptionTitle: z.string(),
  slug: z.string(),
  imgSlider: z.array(z.string()),
  descriptionGeneral: z.string(),
  timeTravel: z.string(),
  itinerary: z.array(z.string()),
  travelDetails: z.array(z.string()),
  considerations: z.array(z.string()),
  additionalServices: z.array(z.string()),
  imgSliderSecondary: z.array(z.string()),
  sectionPrimary: z.string(),
  sectionSecondary: z.string(),
  price: z.array(z.object({
    currency: z.string(),
    amount: z.number(),
    includedServices: z.array(z.string()),
    notIncludedServices: z.array(z.string())
  })),
  comment: z.array(z.object({
    name: z.string(),
    imgProfile: z.string(),
    content: z.string(),
    date: z.string()
  }))
})

export function validateDestination (object) {
  return destinationsSchema.safeParse(object)
}

export function validatePartialDestination (object) {
  return destinationsSchema.partial().safeParse(object)
}
