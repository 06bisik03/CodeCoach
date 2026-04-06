# CodeCoach

CodeCoach is a LeetCode-style interview workspace built with Next.js, Prisma, Monaco Editor, and a local AI coach.

## Local Setup

### 1. Start PostgreSQL

Make sure your local PostgreSQL instance is running and your `.env` points at a real database:

```env
DATABASE_URL="postgresql://your_username@localhost:5432/codecoach"
```

Then apply the schema and seed the sample problems:

```bash
npx prisma db push
npx prisma generate
npm run seed
```

### 2. Install and run Ollama

CodeCoach now defaults to Ollama instead of the paid OpenAI API.

Install Ollama from [ollama.com/download](https://ollama.com/download), then pull a coding model:

```bash
ollama pull qwen2.5-coder:3b
```

If you want a stronger local model and your machine can handle it, you can use:

```bash
ollama pull qwen2.5-coder:7b
```

### 3. Start a local Piston server

`Run Code` now uses Piston for sandboxed execution. The public Piston API is no longer a reliable default, so this project expects a local or self-hosted Piston instance.

Start one locally with Docker:

```bash
docker run --privileged -dit -p 2000:2000 --name piston_api ghcr.io/engineer-man/piston
```

Optional `.env` override if your Piston server lives elsewhere:

```env
PISTON_API_URL="http://127.0.0.1:2000/api/v2"
```

### 4. Optional AI environment variables

The app works with Ollama by default, but you can override the AI settings if you want:

```env
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5-coder:3b"
```

If you ever want to switch back to OpenAI later:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your_key_here"
OPENAI_MODEL="gpt-4o"
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run seed
```

## Notes

- Chat and code analysis use Ollama's local OpenAI-compatible API by default.
- `Run Code` executes the visible test cases for each seeded problem through Piston.
- `.env` is ignored by Git, so keep local secrets there if you later switch back to OpenAI.
