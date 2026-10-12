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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

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
