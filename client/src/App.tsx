import { useEffect, useState } from "react";

type Todo = {
  id: string;
  title: string;
  isComplete: boolean;
  position: number;
  createdAt: string;
};

function sortTodos(todoList: Todo[]) {
  return [...todoList].sort(
    (a, b) =>
      a.position - b.position ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [addingType, setAddingType] = useState<"single" | "ai" | null>(null);
  const [updatingTodoIds, setUpdatingTodoIds] = useState<Set<string>>(
    () => new Set(),
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  // GET Todos function
  useEffect(() => {
    async function getTodos() {
      const response = await fetch("http://localhost:3000/todos");
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      const data: Todo[] = await response.json();
      setTodos(sortTodos(data));
    }

    getTodos().catch((error) => {
      console.error("Failed to fetch todos:", error);
    });
  }, []);

  // Add Single Todo
  async function addTodo() {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }
    setAddingType("single");
    try {
      const response = await fetch("http://localhost:3000/add/todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmedValue }),
      });
      if (!response.ok) {
        throw new Error("Could not update todo. Please try again.");
      }
      const data: Todo = await response.json();
      setTodos((prevTodos) => sortTodos([...prevTodos, data]));
      setInputValue("");
    } catch (error) {
      console.error("Failed to add todo:", error);
      alert("Error adding todo");
    } finally {
      setAddingType(null);
    }
  }

  // Add Multiple Todos with AI
  async function aiGenerateTodo() {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }
    setAddingType("ai");
    try {
      const res = await fetch("http://localhost:3000/api/todos/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputValue }),
      });

      if (!res.ok) {
        throw new Error("Could not generate todos. Please try again.");
      }
      const data: Todo[] = await res.json();

      setTodos((prev) => sortTodos([...prev, ...data]));
      setInputValue("");
    } catch (err) {
      console.error("Failed to generate AI tasks:", err);
      alert("Error generating AI tasks");
    } finally {
      setAddingType(null);
    }
  }

  // PATCH Todo completion status
  async function updateTodo(id: string, isComplete: boolean) {
    setUpdatingTodoIds((prev) => new Set(prev).add(id));
    try {
      const response = await fetch(`http://localhost:3000/todo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isComplete }),
      });
      if (!response.ok) {
        throw new Error("Could not update todo. Please try again.");
      }
      const updatedTodo: Todo = await response.json();
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
      );
    } catch (error) {
      console.error("Failed to update todo:", error);
      alert("Error updating todo");
    } finally {
      setUpdatingTodoIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // DELETE Todo
  async function deleteTodo(id: string) {
    try {
      const response = await fetch(`http://localhost:3000/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Could not delete todo. Please try again.");
      }
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== id),
      );
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-indigo-50 to-sky-100 px-4 py-12 text-slate-800">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-indigo-900/10 backdrop-blur sm:p-10">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Your day, organized
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Todo List
          </h1>
          <p className="mt-2 text-slate-500">
            Small steps add up. What would you like to get done?
          </p>
        </header>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="Add a task..."
            value={inputValue}
            onChange={handleChange}
          />
          <button
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            onClick={addTodo}
            disabled={inputValue.trim() === "" || addingType !== null}
          >
            {addingType === "single" && (
              <span
                className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-3px]"
                aria-hidden="true"
              />
            )}
            {addingType === "single" ? "Adding..." : "Add Todo"}
          </button>
          <button
            className="group relative overflow-hidden rounded-xl border border-fuchsia-300 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-3 font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            onClick={aiGenerateTodo}
            disabled={inputValue.trim() === "" || addingType !== null}
          >
            <span
              className="pointer-events-none absolute inset-0 animate-pulse bg-linear-to-r from-transparent via-white/25 to-transparent"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute left-2 top-0 text-xs text-yellow-200 transition-transform group-hover:scale-125 group-hover:rotate-12"
              aria-hidden="true"
            >
              ✦
            </span>
            <span
              className="pointer-events-none absolute bottom-0 right-2 animate-bounce text-xs text-pink-200"
              aria-hidden="true"
            >
              ✧
            </span>
            {addingType === "ai" && (
              <span
                className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-3px]"
                aria-hidden="true"
              />
            )}
            {addingType === "ai" ? "Generating..." : "AI Add"}
          </button>
        </div>

        <ul className="mt-8 space-y-3">
          {todos.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-slate-500">
              <span className="mb-2 block text-2xl" aria-hidden="true">
                ✦
              </span>
              Your task list is clear. Add your first todo above.
            </li>
          ) : (
            todos.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-100 hover:shadow-md"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 cursor-pointer accent-indigo-600"
                  checked={item.isComplete}
                  disabled={updatingTodoIds.has(item.id)}
                  onChange={(event) =>
                    updateTodo(item.id, event.target.checked)
                  }
                />

                <span
                  className={`min-w-0 flex-1 wrap-break-word ${
                    item.isComplete
                      ? "text-slate-400 line-through"
                      : "text-slate-700"
                  }`}
                >
                  {item.title}
                </span>

                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  onClick={() => deleteTodo(item.id)}
                >
                  delete
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}

export default App;
