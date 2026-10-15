import { useEffect, useState } from "react";

type Todo = {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  // GET Todos function
  useEffect(() => {
    async function getTodos() {
      const response = await fetch("http://localhost:3000/todos");
      if (!response.ok) {
        throw new Error("Failed to fatch todos");
      }
      const data = await response.json();
      setTodos(data);
    }

    getTodos();
  }, []);

  // Add Multiple Todos with AI
  async function aiGenerateTodo() {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/todos/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputValue }),
      });

      const data = await res.json();

      setTodos((prev) => [...prev, ...data]);
      setInputValue("");
    } catch (err) {
      console.error("Failed to generate AI tasks:", err);
      alert("Error generating AI tasks");
    }
  }

  // Add Single Todo
  async function addTodo() {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }
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
    const data = await response.json();
    setTodos((prevTodos) => [...prevTodos, data]);
    setInputValue("");
  }

  // DELETE Todo
  async function deleteTodo(id: number) {
    try {
      const response = await fetch(`http://localhost:3000/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Could not delete todo. Please try again.");
      }
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => String(todo.id) !== String(id)),
      );
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">TodoList</h1>
        <div className="flex gap-2">
          <input
            type="text"
            className="border-2"
            value={inputValue}
            onChange={handleChange}
          />
          <button
            className="bg-black text-white cursor-pointer p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={addTodo}
            disabled={inputValue.trim() === ""}
          >
            Add Todo
          </button>
          <button
            className="bg-black text-white cursor-pointer p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={aiGenerateTodo}
            disabled={inputValue.trim() === ""}
          >
            AI Add
          </button>
        </div>

        <ul>
          {todos.map((item) => (
            <li key={item.id} className="flex gap-2 mt-4">
              <input type="checkbox" />

              <span>{item.title}</span>

              <button
                type="button"
                className="bg-black text-white cursor-pointer p-1"
                onClick={() => deleteTodo(item.id)}
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
