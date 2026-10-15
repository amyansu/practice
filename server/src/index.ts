import express from "express";
import cors from "cors";
import { db } from './db/index.ts'
import { eq } from "drizzle-orm";
import { todosTable } from "./db/schema.ts";
import 'dotenv/config';
import { ChatGoogle } from "@langchain/google";
import * as z from "zod";

const app = express();
app.use(cors());
app.use(express.json());

// Google AI Setup
const model = new ChatGoogle({
  model: "gemini-3.6-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.2,
});

// Define the expected output format using Zod
const TaskBreakdownSchema = z.object({
  tasks: z.array(z.string()).describe("List of sequential, actionable todo items extracted from the prompt"),
});

// Bind schema to Gemini for strict JSON/structured responses
const structuredModel = model.withStructuredOutput(TaskBreakdownSchema);

// --- ROUTES ---

app.get('/', (req, res) => {
  res.json({ message: "server is running" });
});

// GET: Todos
app.get('/todos', async (req, res) => {
  const todos = await db.select().from(todosTable);
  res.json(todos);
});

// POST: Add manual single Todo
app.post('/add/todo', async (req, res) => {
  const { title } = req.body;
  const newTodo = await db.insert(todosTable).values({ title }).returning();
  res.status(201).json(newTodo[0]);
});

// POST: AI breakdown and Add Todos
app.post("/api/todos/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Step A: AI extract the tasks
    const aiResult = await structuredModel.invoke([
      ["system", "You are an assistant that breaks down a messy sentence into clean, actionable, step-by-step tasks."],
      ["user", prompt],
    ]);

    if (!aiResult.tasks || aiResult.tasks.length === 0) {
      return res.json([]);
    }
    // Step B: Bulk insert an array of tasks into Neon DB
    const recordsToInsert = aiResult.tasks.map((taskTitle) => ({
      title: taskTitle,
    }));

    const insertedTodos = await db
      .insert(todosTable)
      .values(recordsToInsert)
      .returning();

    // Step C: Return saved records to the frontend
    res.json(insertedTodos);
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to process AI tasks" });
  }
});

// PUT: Edit Todo
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

// DELETE: Delete Todo
app.delete('/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
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