export const locations = {
  OGGB: { name: "OGGB", x: 520, y: 220 },
  Library: { name: "Library", x: 260, y: 180 },
  Quad: { name: "Quad", x: 380, y: 260 },
  "Science Centre": { name: "Science Centre", x: 150, y: 320 },
}

const items = [
  {
    id: "1",
    kind: "lost",
    category: "electronics",
    title: "Lost: Black iPhone 13",
    description: "Black iPhone with green case. Lock screen photo of mountains.",
    imageUrl: "/black-iphone-13-green-case.png",
    date: new Date().toISOString(),
    location: locations.OGGB,
    reporter: { name: "Guest User", trust: false },
  },
  {
    id: "2",
    kind: "found",
    category: "accessory",
    title: "Found: Blue water bottle",
    description: "Blue metal bottle with dent near cap.",
    imageUrl: "/placeholder-heiw4.png",
    date: new Date(Date.now() - 3600_000).toISOString(),
    location: locations.Quad,
    reporter: { name: "Nadia", trust: true },
  },
  {
    id: "3",
    kind: "lost",
    category: "card",
    title: "Lost: Student ID card",
    description: "UPI: abcd123, name: John D. Please contact.",
    imageUrl: "/student-id-card.png",
    date: new Date(Date.now() - 2 * 3600_000).toISOString(),
    location: locations.Library,
    reporter: { name: "Jerry", trust: true },
  },
  {
    id: "4",
    kind: "found",
    category: "apparel",
    title: "Found: Hoodie near Science Centre",
    description: "Grey hoodie size M with logo on sleeve.",
    imageUrl: "/grey-hoodie.png",
    date: new Date(Date.now() - 3 * 3600_000).toISOString(),
    location: locations["Science Centre"],
    reporter: { name: "Liam", trust: false },
  },
]

export function getItemsClient() {
  return items.map((i) => ({ 
    ...i, 
    reporter: { ...i.reporter }, 
    location: { ...i.location } 
  }))
}
