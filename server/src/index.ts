import express from "express";
import cors from "cors";
import { db } from './db/index.ts'
import { asc, eq, max } from "drizzle-orm";
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
  try {
    console.log("server is running");
    res.json({ message: "server is running" });
  } catch (error) {
    console.error("Root route error:", error);
    res.status(500).json({ error: "Server check failed" });
  }
});

// GET: Todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await db
      .select()
      .from(todosTable)
      .orderBy(
        asc(todosTable.position),
        asc(todosTable.createdAt),
        asc(todosTable.id),
      );
    res.json(todos);
  } catch (error) {
    console.error("Database fetch error:", error);
    res.status(500).json({ error: "Failed to fetch todos from database" });
  }
});

// POST: Add manual single Todo
app.post('/add/todo', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Todo title is required" });
    }

    const [{ maxPosition }] = await db
      .select({ maxPosition: max(todosTable.position) })
      .from(todosTable);
    const newTodo = await db
      .insert(todosTable)
      .values({
        title: title.trim(),
        isComplete: false,
        position: (maxPosition ?? -1) + 1,
      })
      .returning();

    res.status(201).json(newTodo[0]);
  } catch (error) {
    console.error("Todo creation error:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// POST: AI breakdown and Add Todos
app.post("/api/todos/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Step A: AI extract the tasks
    const aiResult = await structuredModel.invoke([
      ["system", "You are an assistant that breaks down a messy sentence into clean, actionable, step-by-step tasks."],
      ["user", prompt],
    ]);

    if (!aiResult.tasks || aiResult.tasks.length === 0) {
      return res.json([]);
    }
    // Step B: Bulk insert an array of tasks into Neon DB
    const taskTitles = aiResult.tasks
      .map((taskTitle) => taskTitle.trim())
      .filter((taskTitle) => taskTitle.length > 0);

    if (taskTitles.length === 0) {
      return res.json([]);
    }

    const [{ maxPosition }] = await db
      .select({ maxPosition: max(todosTable.position) })
      .from(todosTable);
    const nextPosition = (maxPosition ?? -1) + 1;
    const recordsToInsert = taskTitles.map((title, index) => ({
      title,
      isComplete: false,
      position: nextPosition + index,
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

// PATCH: Edit Todo
app.patch('/todo/:id', async (req, res) => {
  const id = req.params.id;
  const { isComplete } = req.body;

  if (typeof isComplete !== "boolean") {
    return res.status(400).json({ error: "isComplete must be a boolean" });
  }

  try {
    const updatedTodo = await db
      .update(todosTable)
      .set({ isComplete })
      .where(eq(todosTable.id, id))
      .returning();

    if (updatedTodo.length === 0) {
      return res.status(404).json({ message: "todo not found" });
    }

    res.json(updatedTodo[0]);
  } catch (error) {
    console.error("Todo update error:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// DELETE: Delete Todo
app.delete('/todos/:id', async (req, res) => {
  const id = req.params.id;
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