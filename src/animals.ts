export type AnimalId = "cat" | "cow" | "dog" | "duck" | "sheep" | "owl" | "pig";

export interface Animal {
  id: AnimalId;
  name: string;
  call: string;
  emoji: string;
  image: string;
  accent: string;
}

const illustrationAssets: Record<AnimalId, string> = {
  cat: "/manus-storage/async-images/9vr3Ql4F6te5f2b7fBp1VD/image-1.webp",
  cow: "/manus-storage/async-images/9vr3Ql4F6te5f2b7fBp1VD/image-2.webp",
  dog: "/manus-storage/async-images/9vr3Ql4F6te5f2b7fBp1VD/image-3.webp",
  duck: "/manus-storage/async-images/9vr3Ql4F6te5f2b7fBp1VD/image-4.webp",
  owl: "/manus-storage/async-images/I2qMpwxLVfwRBOWi2oc7to/image-1.webp",
  pig: "/manus-storage/async-images/I2qMpwxLVfwRBOWi2oc7to/image-2.webp",
  sheep: "/manus-storage/async-images/I2qMpwxLVfwRBOWi2oc7to/image-3.webp",
};

export const animals: Animal[] = [
  { id: "cat", name: "Cat", call: "Meow", emoji: "🐈", image: illustrationAssets.cat, accent: "#ce8452" },
  { id: "cow", name: "Cow", call: "Moo", emoji: "🐄", image: illustrationAssets.cow, accent: "#8d735b" },
  { id: "dog", name: "Dog", call: "Woof", emoji: "🐕", image: illustrationAssets.dog, accent: "#c19350" },
  { id: "duck", name: "Duck", call: "Quack", emoji: "🦆", image: illustrationAssets.duck, accent: "#dda83f" },
  { id: "sheep", name: "Sheep", call: "Baa", emoji: "🐑", image: illustrationAssets.sheep, accent: "#8b9780" },
  { id: "owl", name: "Owl", call: "Hoot", emoji: "🦉", image: illustrationAssets.owl, accent: "#8c7257" },
  { id: "pig", name: "Pig", call: "Oink", emoji: "🐖", image: illustrationAssets.pig, accent: "#d28c87" },
];

export function findAnimal(label: string): Animal | undefined {
  return animals.find((animal) => animal.id === label.trim().toLowerCase());
}
