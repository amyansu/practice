import { useEffect, useState } from "react";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");

  type Todo = {
    id: number;
    title: string;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };

  const getTodos = async (): Promise<Todo[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/todos`);

    return response.json();
  };
  useEffect(() => {
    let isCurrent = true;

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  // function handleEdit(){

  // }

  function handleDelete() {}

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
            onClick={addTodo}
          >
            Add Todo
          </button>
        </div>
        <ul>
          {todos.map((item) => (
            <li key={item.id} className="flex gap-2 mt-4">
              <input type="checkbox" readOnly />
              <span>{item.title}</span>
              {/* <button className="bg-black text-white cursor-pointer p-1" onClick={handleEdit}>
                edit
              </button> */}
              <button
                className="bg-black text-white cursor-pointer p-1"
                onClick={handleDelete}
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
