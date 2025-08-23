import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;
const JWT_SECRET = "supersecret"; // ⚠️ replace with env variable

app.use(cors());
app.use(bodyParser.json());

// In-memory users (replace with DB)
const users: { username: string; email: string; password: string }[] = [];

// ✅ Register
app.post("/users/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  if (users.find((u) => u.email === email))
    return res.status(400).json({ message: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });
  return res.status(201).json({ message: "User registered successfully" });
});

// ✅ Login
app.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });
  return res.json({ message: "Login successful", token });
});

// ✅ Current User (protected)
app.get("/users/me", (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token provided" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const user = users.find((u) => u.email === decoded.email);
    return res.json({ user });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// ✅ Upload (stub)
app.get("/upload", (req: Request, res: Response) => {
  res.json({ message: "Upload endpoint not implemented yet" });
});

// ✅ Analytics (stub)
app.get("/analytics", (req: Request, res: Response) => {
  res.json({ message: "Analytics endpoint not implemented yet" });
});

// ✅ Serve default avatar
app.get("/default-avatar.png", (req: Request, res: Response) => {
  res.sendFile(__dirname + "/default-avatar.png"); // put a file there
});

app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));

