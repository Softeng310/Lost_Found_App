export interface Item {
  id: string
  title: string
  status: string
  reporter: {
    name: string
  }
  claims: Array<{
    claimer: string
  }>
}

export function getItemsClient(): Item[] {
  return [
    {
      id: "1",
      title: "Lost: Black iPhone 13",
      status: "Open",
      reporter: { name: "Guest User" },
      claims: []
    },
    {
      id: "2", 
      title: "Found AirPods",
      status: "Unclaimed",
      reporter: { name: "John Doe" },
      claims: []
    }
  ]
}
