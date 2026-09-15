import { Counter } from "./counter";

export default function HomePage() {
  return (
    <main>
      <h1>{{title}}</h1>
      <p>{{description}}</p>
      <Counter />
    </main>
  );
}
