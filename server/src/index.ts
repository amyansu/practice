import express from "express";
import cors from "cors";
import { db } from './db/index.ts'
import { eq } from "drizzle-orm";
import { todosTable } from "./db/schema.ts";
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/todos', async (req, res) => {
  const todos = await db.select().from(todosTable);
  res.json(todos);
});

app.post('/add/todo', async (req, res) => {
  const { title } = req.body;
  const newTodo = await db.insert(todosTable).values({ title }).returning();
  res.status(201).json(newTodo[0]);
});

app.put('/todo/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title } = req.body;
  const updatedTodo = await db
    .update(todosTable)
    .set({
      title, updatedAt: new Date(),
    })
    .where(eq(todosTable.id, id))
    .returning();
  res.json(updatedTodo[0]);
});

app.delete('/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  console.log(id)
  try {
    const deletedUser = await db
      .delete(todosTable)
      .where(eq(todosTable.id, id))
      .returning();

    if (deletedUser.length === 0) {
      res.json({ message: "todo not found" })
    } else {
      res.json({ message: "todo deleted" })
    }
  } catch (error) {
    res.json({ message: "todo not deleted" })
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));