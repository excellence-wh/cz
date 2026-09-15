import { useCounterStore } from "./store";

export function App() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const reset = useCounterStore((state) => state.reset);

  return (
    <main>
      <h1>{{title}}</h1>
      <p>
        count: <output>{count}</output>
      </p>
      <button type="button" onClick={increment}>
        +1
      </button>
      <button type="button" onClick={reset}>
        reset
      </button>
    </main>
  );
}
