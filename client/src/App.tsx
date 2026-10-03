import { useState } from "react";

function App() {
  const [todos, setTodos] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  function addTodo() {
    setTodos((prevTodos) => [...prevTodos, inputValue]);
    setInputValue("");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  // function handleEdit(){

  // }

  function handleDelete(){
    
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
            onClick={addTodo}
          >
            Add Todo
          </button>
        </div>
        <ul>
          {todos.map((item, index) => (
            <li key={index} className="flex gap-2 mt-4">
              <input type="checkbox" readOnly />
              <span>{item}</span>
              {/* <button className="bg-black text-white cursor-pointer p-1" onClick={handleEdit}>
                edit
              </button> */}
              <button className="bg-black text-white cursor-pointer p-1" onClick={handleDelete}>
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
