import { useEffect, useState } from "react";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  type Todo = {
    id: number;
    title: string;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };

  useEffect(() => {
    let isCurrent = true;

    const getTodos = async (): Promise<Todo[]> => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/todos`);

      return response.json();
    };

    getTodos().then((data) => {
      if (isCurrent) {
        setTodos(data);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  function addTodo() {
    const now = new Date().toISOString();
    const newTodo: Todo = {
      id: Date.now(),
      title: inputValue,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    setTodos((prevTodos) => [...prevTodos, newTodo]);
    setInputValue("");
  }

  async function saveTodo() {
    if (editingTodoId === null || !inputValue.trim()) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/todo/${editingTodoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: inputValue.trim() }),
        },
      );

      if (!response.ok) {
        throw new Error("Could not update todo. Please try again.");
      }

      const updatedTodo: Todo = await response.json();
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === updatedTodo.id ? updatedTodo : todo,
        ),
      );
      setEditingTodoId(null);
      setInputValue("");
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not update todo. Please try again.");
    }
  }

  function cancelEdit() {
    setEditingTodoId(null);
    setInputValue("");
    setErrorMessage("");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  async function handleDelete(id: number) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/todos/${id}`,
      {
        method: "DELETE",
      },
    );

    if (response.ok) {
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
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
            className="bg-black text-white cursor-pointer p-2"
            onClick={editingTodoId === null ? addTodo : saveTodo}
          >
            {editingTodoId === null ? "Add Todo" : "Save"}
          </button>
          {editingTodoId !== null && (
            <button className="cursor-pointer p-2" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
        {errorMessage && <p role="alert">{errorMessage}</p>}
        <ul>
          {todos.map((item) => (
            <li key={item.id} className="flex gap-2 mt-4">
              <input type="checkbox" readOnly />
              <span>{item.title}</span>
              <button
                className="bg-black text-white cursor-pointer p-1"
                onClick={() => {
                  setEditingTodoId(item.id);
                  setInputValue(item.title);
                  setErrorMessage("");
                }}
              >
                edit
              </button>
              <button
                className="bg-black text-white cursor-pointer p-1"
                onClick={() => handleDelete(item.id)}
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
