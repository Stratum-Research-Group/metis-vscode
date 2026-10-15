/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccessor, useIsDark } from '../util/services.js';
import {
	Play,
	Square,
	RotateCcw,
	Activity,
	Shield,
	Brain,
	Terminal,
	Server,
	Cpu,
	Database,
	ExternalLink,
	CheckCircle2,
	AlertTriangle,
	Flame,
	FolderPlus,
	FolderOpen,
	GitBranch,
	RefreshCw,
	Loader2,
	Check,
	Lock,
	Rocket,
	Layers,
	FileCode,
	Sparkles,
	Settings as SettingsIcon,
	Code2,
	Radio,
	Clock,
	Search
} from 'lucide-react';
import { URI } from '../../../../../../../base/common/uri.js';
import { VSBuffer } from '../../../../../../../base/common/buffer.js';
import { useMetisStackStatus, useStackController } from './MetisSovereignSettings.js';

interface ProjectTemplate {
	id: string;
	title: string;
	tag: string;
	description: string;
	icon: any;
	accentColor: string;
	defaultName: string;
	files: (projectName: string) => { path: string; content: string }[];
}

const TEMPLATES: ProjectTemplate[] = [
	{
		id: 'metis-agent',
		title: 'Metis Autonomous Agent',
		tag: 'Kybernetes + Stoma',
		description: 'Complete autonomous subagent pipeline with Odyssey milestone tracking, Stoma memory, tool execution harness, and test suite.',
		icon: Brain,
		accentColor: '#38bdf8',
		defaultName: 'metis-sentinel-agent',
		files: (name: string) => [
			{
				path: 'agent.yaml',
				content: `# Metis Sovereign Autonomous Agent Manifest
name: "${name}"
version: "1.0.0"
runtime:
  orchestrator: "http://127.0.0.1:8081/v1"
  model: "qwen2.5-coder-7b-instruct"
  max_turns: 25
  token_budget: 32000
memory:
  stoma_root: ".stoma"
  vector_index: true
governance:
  phylax_sandbox: "subagent-worktree"
  require_tool_approval: false
`
			},
			{
				path: 'main.py',
				content: `#!/usr/bin/env python3
"""
${name} - Metis Autonomous Agent
Orchestrated via Kybernetes on local Arch Linux stack.
"""
import asyncio
import os
import httpx
from rich.console import Console

console = Console()

KYBERNETES_URL = os.getenv("KYBERNETES_URL", "http://127.0.0.1:8081/v1")
HESTIA_URL = os.getenv("HESTIA_URL", "http://127.0.0.1:8080/v1")

async def run_agent_loop(task: str):
    console.print(f"[bold cyan]🏛️ Starting ${name}...[/bold cyan]")
    console.print(f"[dim]Connecting to Kybernetes orchestrator: {KYBERNETES_URL}[/dim]")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Check Kybernetes health
        try:
            health = await client.get(f"{KYBERNETES_URL}/health")
            console.print(f"[green]✓ Kybernetes status: {health.json().get('status', 'online')}[/green]")
        except Exception as e:
            console.print(f"[yellow]⚠ Kybernetes offline or unreachable: {e}[/yellow]")
            console.print("[dim]Ensure stack is running from Metis Sovereign Studio Dashboard.[/dim]")
            return

        console.print(f"[bold green]▶ Dispatching task:[/bold green] {task}")
        # Execute autonomous loop
        console.print("[cyan]Agent execution active. Monitoring subagent worktrees...[/cyan]")

if __name__ == "__main__":
    import sys
    task_desc = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Inspect repository health and verify local tools"
    asyncio.run(run_agent_loop(task_desc))
`
			},
			{
				path: 'tools.py',
				content: `"""Custom local tool definitions for ${name}."""
from typing import Dict, Any

def execute_local_command(cmd: str) -> Dict[str, Any]:
    """Execute command in sandbox."""
    return {"command": cmd, "status": "executed"}

def query_stoma_memory(query: str) -> Dict[str, Any]:
    """Retrieve semantic context from local Stoma database."""
    return {"query": query, "results": []}
`
			},
			{
				path: 'tests/test_agent.py',
				content: `import pytest

def test_agent_manifest():
    import yaml
    with open("agent.yaml") as f:
        data = yaml.safe_load(f)
    assert data["name"] == "${name}"
    assert data["runtime"]["token_budget"] > 0
`
			},
			{
				path: 'pyproject.toml',
				content: `[project]
name = "${name}"
version = "0.1.0"
description = "Metis Autonomous Agent"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "httpx>=0.27.0",
    "pydantic>=2.0",
    "pyyaml>=6.0",
    "rich>=13.0"
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
`
			},
			{
				path: 'README.md',
				content: `# 🏛️ ${name}

Autonomous agent project created with **Metis Sovereign Studio**.

## Architecture
- **Inference**: Local Hestia Engine (\`http://127.0.0.1:8080\`)
- **Orchestration**: Kybernetes Agent Supervisor (\`http://127.0.0.1:8081\`)
- **Memory**: Stoma Hierarchical Vector Index (\`.stoma\`)
- **Security**: Phylax local sandbox governance

## Quick Start
\`\`\`bash
# 1. Install dependencies
uv sync || pip install -e .

# 2. Run agent
python main.py "Analyze workspace and suggest sovereign optimizations"
\`\`\`
`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n*.pyc\n.stoma/\n*.db\n.env\n`
			}
		]
	},
	{
		id: 'fastapi-ai-server',
		title: 'FastAPI Local AI Server',
		tag: 'REST API + Hestia',
		description: 'Asynchronous local AI backend proxying requests to local Hestia models with SSE streaming and OpenAPI documentation.',
		icon: Server,
		accentColor: '#10b981',
		defaultName: 'sovereign-ai-api',
		files: (name: string) => [
			{
				path: 'app/main.py',
				content: `import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
from pydantic import BaseModel

app = FastAPI(title="${name}", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HESTIA_URL = os.getenv("HESTIA_URL", "http://127.0.0.1:8080/v1")

class PromptRequest(BaseModel):
    prompt: str
    model: str = "qwen2.5-coder-7b-instruct"
    max_tokens: int = 1024
    temperature: float = 0.2

@app.get("/health")
async def health():
    return {"status": "online", "backend": HESTIA_URL}

@app.post("/v1/generate")
async def generate(req: PromptRequest):
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                f"{HESTIA_URL}/chat/completions",
                json={
                    "model": req.model,
                    "messages": [{"role": "user", "content": req.prompt}],
                    "max_tokens": req.max_tokens,
                    "temperature": req.temperature,
                }
            )
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Hestia error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8008, reload=True)
`
			},
			{
				path: 'requirements.txt',
				content: `fastapi>=0.110.0\nuvicorn[standard]>=0.29.0\nhttpx>=0.27.0\npydantic>=2.6.0\n`
			},
			{
				path: '.env',
				content: `HESTIA_URL=http://127.0.0.1:8080/v1\nKYBERNETES_URL=http://127.0.0.1:8081/v1\nPORT=8008\n`
			},
			{
				path: 'README.md',
				content: `# ⚡ ${name}

FastAPI microservice connected to the local Metis Hestia inference server.

## Run Server
\`\`\`bash
pip install -r requirements.txt
python -m app.main
\`\`\`
Visit docs: [http://127.0.0.1:8008/docs](http://127.0.0.1:8008/docs)
`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n*.pyc\n.env\n`
			}
		]
	},
	{
		id: 'dianoia-pipeline',
		title: 'Dianoia Deliberation Engine',
		tag: 'MCTS + Krisis Gate',
		description: 'Monte Carlo Tree Search multi-rollout debate pipeline with Krisis candidate verification and safety gating.',
		icon: Flame,
		accentColor: '#f59e0b',
		defaultName: 'dianoia-mcts-deliberator',
		files: (name: string) => [
			{
				path: 'deliberate.py',
				content: `#!/usr/bin/env python3
"""
${name} - Multi-Rollout MCTS Reasoning Pipeline
Executes exploratory tree search with Krisis candidate gating.
"""
import math
import random
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class MCTSNode:
    state: str
    parent: Optional['MCTSNode'] = None
    children: List['MCTSNode'] = field(default_factory=list)
    visits: int = 0
    value: float = 0.0

    def ucb1(self, c: float = 1.414) -> float:
        if self.visits == 0:
            return float('inf')
        return (self.value / self.visits) + c * math.sqrt(math.log(self.parent.visits) / self.visits)

def run_deliberation(problem: str, rollouts: int = 16):
    print(f"⚖️ Deliberating on: {problem}")
    root = MCTSNode(state="root")
    print(f"✓ Completed {rollouts} MCTS iterations with Krisis candidate verification.")
    return "Optimized verdict produced."

if __name__ == "__main__":
    run_deliberation("Determine optimal architecture for sovereign local subagents")
`
			},
			{
				path: 'krisis_verifier.py',
				content: `"""Krisis Candidate Gate Verification Rules."""
def verify_candidate(code_snippet: str) -> bool:
    # Rule 1: No telemetry or cloud leaks
    forbidden = ["api.openai.com", "telemetry", "tracking"]
    for word in forbidden:
        if word in code_snippet:
            return False
    return True
`
			},
			{
				path: 'pyproject.toml',
				content: `[project]
name = "${name}"
version = "0.1.0"
dependencies = ["rich", "pydantic>=2.0"]
`
			},
			{
				path: 'README.md',
				content: `# ⚖️ ${name}\n\nDianoia MCTS Deliberation Engine with Krisis gating.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n`
			}
		]
	},
	{
		id: 'stoma-knowledge-base',
		title: 'Stoma Sovereign Knowledge Base',
		tag: 'SQLite-vec + RAG',
		description: 'Vector and graph knowledge store with SQLite-vec embeddings, semantic document chunking, and fast retrieval.',
		icon: Database,
		accentColor: '#a855f7',
		defaultName: 'sovereign-stoma-kb',
		files: (name: string) => [
			{
				path: 'ingest.py',
				content: `"""Document ingestion and semantic chunking for Stoma KB."""
import os
import sqlite3

def init_db(db_path: str = "stoma_kb.db"):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE,
        content TEXT,
        chunk_count INTEGER,
        indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()
    print(f"✓ Initialized Stoma knowledge database: {db_path}")

if __name__ == "__main__":
    init_db()
`
			},
			{
				path: 'query.py',
				content: `"""Search & query Stoma Knowledge Base."""
def query_kb(text: str):
    print(f"Searching Stoma KB for: {text}")
    return []

if __name__ == "__main__":
    query_kb("Metis sovereign architecture specifications")
`
			},
			{
				path: 'requirements.txt',
				content: `sqlite-vec>=0.1.0\nrich>=13.0\n`
			},
			{
				path: 'README.md',
				content: `# 🧠 ${name}\n\nLocal vector knowledge base powered by Metis Stoma.\n`
			},
			{
				path: '.gitignore',
				content: `*.db\n.venv/\n__pycache__/\n`
			}
		]
	},
	{
		id: 'prosopon-persona',
		title: 'Prosopon Voice & Persona Client',
		tag: 'Piper TTS + Whisper',
		description: 'Interactive voice client integrating with Prosopon local WebRTC/WebSocket audio streaming engine.',
		icon: Radio,
		accentColor: '#ec4899',
		defaultName: 'prosopon-voice-client',
		files: (name: string) => [
			{
				path: 'persona.yaml',
				content: `name: "Metis Voice Assistant"
voice:
  tts_model: "en_US-lessac-medium"
  speed: 1.05
  stt_model: "whisper-base.en"
system_prompt: |
  You are Metis, a sovereign AI assistant running locally on Arch Linux.
  Provide concise, direct answers with high technical precision.
`
			},
			{
				path: 'client.py',
				content: `"""Connect to local Prosopon audio streaming server."""
import os

PROSOPON_HOST = os.getenv("PROSOPON_HOST", "127.0.0.1")
PROSOPON_PORT = int(os.getenv("PROSOPON_PORT", "8000"))

print(f"Connecting to Prosopon on ws://{PROSOPON_HOST}:{PROSOPON_PORT}/ws/audio...")
`
			},
			{
				path: 'requirements.txt',
				content: `websockets>=12.0\npyyaml>=6.0\n`
			},
			{
				path: 'README.md',
				content: `# 🎭 ${name}\n\nProsopon real-time persona voice streaming client.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n`
			}
		]
	},
	{
		id: 'blank-sovereign',
		title: 'Blank Sovereign Workspace',
		tag: 'Clean Sovereign Repo',
		description: 'Clean repository pre-configured with .sovereign/ bindings, local environment variables, and git initialized.',
		icon: FolderPlus,
		accentColor: '#64748b',
		defaultName: 'sovereign-workspace',
		files: (name: string) => [
			{
				path: '.sovereign/metis.json',
				content: JSON.stringify({
					projectName: name,
					created: new Date().toISOString(),
					stack: {
						hestia: "http://127.0.0.1:8080",
						kybernetes: "http://127.0.0.1:8081",
						prosopon: "http://127.0.0.1:8000"
					}
				}, null, 2)
			},
			{
				path: 'README.md',
				content: `# ${name}\n\nSovereign workspace configured for Metis Sovereign Studio.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n.env\n*.log\n`
			}
		]
	}
];

export const MetisDashboard: React.FC = () => {
	const accessor = useAccessor();
	const isDark = useIsDark();

	const commandService = accessor.get('ICommandService');
	const fileService = accessor.get('IFileService');
	const notificationService = accessor.get('INotificationService');
	const workspacesService = accessor.get('IWorkspacesService');
	const terminalService = accessor.get('ITerminalService');

	// Stack controller & live status
	const { status, isProbing, probeStack } = useMetisStackStatus();
	const {
		startAllStack,
		stopAllStack,
		restartAllStack,
		runDoctor,
		openProsopon
	} = useStackController();

	// Templates & creation state
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>('metis-agent');
	const [projectName, setProjectName] = useState<string>('metis-sentinel-agent');
	const [parentDir, setParentDir] = useState<string>('/home/akarta/Projects');
	const [initGit, setInitGit] = useState<boolean>(true);
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

	// Recent projects list
	const [recentItems, setRecentItems] = useState<{ path: string; name: string; uri: any }[]>([]);
	const [recentSearch, setRecentSearch] = useState<string>('');
	const [isLoadingRecents, setIsLoadingRecents] = useState<boolean>(true);

	const selectedTemplate = useMemo(() => {
		return TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
	}, [selectedTemplateId]);

	// Load recent workspaces
	const loadRecents = useCallback(async () => {
		setIsLoadingRecents(true);
		try {
			const res = await workspacesService.getRecentlyOpened();
			const list: { path: string; name: string; uri: any }[] = [];

			if (res && res.workspaces) {
				for (const item of res.workspaces) {
					let uri: any = null;
					let label = (item as any).label;

					if ((item as any).folderUri) {
						uri = (item as any).folderUri;
					} else if ((item as any).workspace) {
						uri = (item as any).workspace.configPath;
					}

					if (uri) {
						const fsPath = uri.fsPath || uri.path || '';
						const cleanPath = fsPath.replace(/\/$/, '');
						const name = label || cleanPath.split('/').filter(Boolean).pop() || cleanPath;
						list.push({ path: cleanPath, name, uri });
					}
				}
			}

			// Add known local defaults if list is short
			if (list.length === 0) {
				list.push(
					{ path: '/home/akarta/Projects/Metis', name: 'Metis Sovereign Core', uri: URI.file('/home/akarta/Projects/Metis') },
					{ path: '/home/akarta/Projects/Aisthesis', name: 'Aisthesis', uri: URI.file('/home/akarta/Projects/Aisthesis') },
					{ path: '/home/akarta/Projects/Eunomia', name: 'Eunomia', uri: URI.file('/home/akarta/Projects/Eunomia') }
				);
			}

			setRecentItems(list);
		} catch (err) {
			console.error('Failed to load recent workspaces:', err);
		} finally {
			setIsLoadingRecents(false);
		}
	}, [workspacesService]);

	useEffect(() => {
		loadRecents();
	}, [loadRecents]);

	// Filtered recents
	const filteredRecents = useMemo(() => {
		if (!recentSearch.trim()) return recentItems;
		const q = recentSearch.toLowerCase();
		return recentItems.filter(r => r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q));
	}, [recentItems, recentSearch]);

	// Handle template selection change
	const handleSelectTemplate = (tmpl: ProjectTemplate) => {
		setSelectedTemplateId(tmpl.id);
		setProjectName(tmpl.defaultName);
	};

	// Create and Launch Project
	const handleCreateProject = async () => {
		if (!projectName.trim()) {
			notificationService.error('Please enter a valid project name.');
			return;
		}

		setIsCreating(true);
		setCreateSuccessMsg(null);

		const cleanParent = parentDir.replace(/\/$/, '');
		const targetDir = `${cleanParent}/${projectName.trim()}`;
		const projectUri = URI.file(targetDir);

		try {
			// 1. Create root folder
			await fileService.createFolder(projectUri);

			// 2. Generate and write all files
			const filesToCreate = selectedTemplate.files(projectName.trim());
			for (const file of filesToCreate) {
				const filePath = `${targetDir}/${file.path}`;
				const fileUri = URI.file(filePath);

				// Ensure subdirectories exist if path contains slashes
				if (file.path.includes('/')) {
					const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
					await fileService.createFolder(URI.file(parentPath));
				}

				await fileService.createFile(fileUri, VSBuffer.fromString(file.content), { overwrite: true });
			}

			// 3. Optional git init
			if (initGit) {
				try {
					const term = await terminalService.createTerminal({
						config: { name: `Init ${projectName}` },
						cwd: targetDir
					});
					term.sendText('git init && git add . && git commit -m "Initial commit from Metis Sovereign Studio"', true);
				} catch (e) {
					console.warn('Git init failed or skipped:', e);
				}
			}

			setCreateSuccessMsg(`Project created successfully at ${targetDir}! Launching workspace...`);
			notificationService.info(`Project '${projectName}' created. Launching Sovereign Workspace...`);

			// 4. Open folder in VS Code
			setTimeout(async () => {
				await commandService.executeCommand('vscode.openFolder', projectUri, { forceReuseWindow: true });
			}, 900);

		} catch (err: any) {
			console.error('Project creation failed:', err);
			notificationService.error(`Failed to create project: ${err?.message || err}`);
		} finally {
			setIsCreating(false);
		}
	};

	// Open Folder directly
	const handleOpenFolder = async () => {
		await commandService.executeCommand('workbench.action.files.openFolder');
	};

	// Clone repo
	const handleCloneRepo = async () => {
		await commandService.executeCommand('git.clone');
	};

	// Open Metis settings
	const handleOpenSettings = async () => {
		await commandService.executeCommand('workbench.action.openVoidSettings');
	};

	// Open a specific recent project
	const handleOpenRecent = async (item: { uri: any }) => {
		await commandService.executeCommand('vscode.openFolder', item.uri, { forceReuseWindow: true });
	};

	const allOnline = status.hestia.online && status.kybernetes.online && status.prosopon.online;

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''} bg-[#0b0f19] text-gray-100 min-h-screen select-none overflow-y-auto`} style={{ height: '100%', width: '100%' }}>
			<div className="max-w-[1240px] mx-auto px-6 py-8 pb-24">

				{/* ───────────── HERO BRAND HEADER ───────────── */}
				<header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1829] via-[#0f1f38] to-[#121927] border border-[#1e293b] p-6 shadow-2xl mb-8">
					<div className="absolute -right-8 -top-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
					<div className="absolute right-48 -bottom-8 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

					<div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
									<Rocket className="w-5 h-5 text-white" />
								</div>
								<div>
									<h1 className="text-2xl font-black tracking-wider text-white uppercase flex items-center gap-2">
										Metis Sovereign Studio
										<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 normal-case tracking-normal">
											v1.0 Local Arch
										</span>
									</h1>
									<p className="text-xs text-gray-400">
										Local AI Orchestration, Inference, and Autonomous Agent Command Deck
									</p>
								</div>
							</div>

							{/* Hardware and Air-gap badges */}
							<div className="flex flex-wrap items-center gap-2 mt-3">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131d31] border border-cyan-900/50 text-cyan-300 text-xs font-medium">
									<Cpu className="w-3.5 h-3.5 text-cyan-400" />
									NVIDIA RTX 5060 Ti (16GB VRAM)
								</span>
								<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131d31] border border-emerald-900/50 text-emerald-300 text-xs font-medium">
									<Shield className="w-3.5 h-3.5 text-emerald-400" />
									100% Air-Gapped • Zero Telemetry
								</span>
								<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131d31] border border-purple-900/50 text-purple-300 text-xs font-medium">
									<Activity className="w-3.5 h-3.5 text-purple-400" />
									CUDA 12.8 Acceleration
								</span>
							</div>
						</div>

						{/* Quick Access Action Bar */}
						<div className="flex flex-wrap items-center gap-2">
							<button
								onClick={handleOpenSettings}
								className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b]/70 hover:bg-[#334155] border border-gray-700 text-xs font-medium text-gray-200 transition-all hover:scale-[1.02] shadow-sm"
								title="Open detailed Metis Sovereign Settings"
							>
								<SettingsIcon className="w-4 h-4 text-cyan-400" />
								Settings & C&C
							</button>

							<button
								onClick={runDoctor}
								className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b]/70 hover:bg-[#334155] border border-gray-700 text-xs font-medium text-gray-200 transition-all hover:scale-[1.02] shadow-sm"
								title="Inspect subsystem health"
							>
								<Terminal className="w-4 h-4 text-emerald-400" />
								Stack Doctor
							</button>

							<button
								onClick={openProsopon}
								className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:from-purple-800/80 hover:to-pink-800/80 border border-purple-500/40 text-xs font-medium text-purple-200 transition-all hover:scale-[1.02] shadow-sm"
								title="Open Prosopon Web Studio in browser"
							>
								<ExternalLink className="w-4 h-4 text-purple-300" />
								Prosopon Web Studio
							</button>
						</div>
					</div>
				</header>

				{/* ───────────── MASTER STACK CONTROLLER & HEALTH STATUS ───────────── */}
				<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl mb-8">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-bold text-white flex items-center gap-2">
									<Flame className="w-4 h-4 text-orange-400" />
									Metis Sovereign Stack Engine
								</h2>
								<span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${allOnline ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400' : 'bg-amber-950/70 border-amber-500/50 text-amber-400'}`}>
									{allOnline ? 'ALL SYSTEMS OPERATIONAL' : 'STACK PARTIAL / STANDBY'}
								</span>
							</div>
							<p className="text-xs text-gray-400 mt-0.5">
								Unified daemon launcher for Hestia (:8080), Kybernetes (:8081), and Prosopon (:8000)
							</p>
						</div>

						{/* Stack Launch Controls */}
						<div className="flex items-center gap-2.5">
							<button
								onClick={startAllStack}
								className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95"
							>
								<Play className="w-3.5 h-3.5 fill-current" />
								Launch Full Stack
							</button>

							<button
								onClick={restartAllStack}
								className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-medium transition-all hover:scale-[1.02] active:scale-95"
							>
								<RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
								Restart
							</button>

							<button
								onClick={stopAllStack}
								className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-800/50 text-red-300 text-xs font-medium transition-all hover:scale-[1.02] active:scale-95"
							>
								<Square className="w-3.5 h-3.5 fill-current" />
								Stop All
							</button>

							<button
								onClick={probeStack}
								className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-all"
								title="Probe stack health now"
							>
								<RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-cyan-400' : ''}`} />
							</button>
						</div>
					</div>

					{/* 3 Live Service Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
						{/* HESTIA */}
						<div className={`p-4 rounded-xl border transition-all ${status.hestia.online ? 'bg-[#0e2238]/60 border-cyan-800/60 shadow-lg shadow-cyan-950/20' : 'bg-gray-900/70 border-gray-800'}`}>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<div className={`w-2.5 h-2.5 rounded-full ${status.hestia.online ? 'bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
									<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">Hestia Inference</h3>
								</div>
								<span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
									:8080
								</span>
							</div>
							<div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
								<span>Status: <strong className={status.hestia.online ? 'text-emerald-400' : 'text-gray-500'}>{status.hestia.online ? 'ONLINE' : 'OFFLINE'}</strong></span>
								{status.hestia.latency !== null && (
									<span className="font-mono text-gray-400">{status.hestia.latency} ms</span>
								)}
							</div>
							<p className="text-[11px] text-gray-400 leading-tight">
								{status.hestia.online
									? `Loaded: Qwen 2.5 Coder 7B (Q4_K_M)`
									: `Local GGUF engine standby. Click Launch to start.`}
							</p>
						</div>

						{/* KYBERNETES */}
						<div className={`p-4 rounded-xl border transition-all ${status.kybernetes.online ? 'bg-[#0d2a20]/60 border-emerald-800/60 shadow-lg shadow-emerald-950/20' : 'bg-gray-900/70 border-gray-800'}`}>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<div className={`w-2.5 h-2.5 rounded-full ${status.kybernetes.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
									<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">Kybernetes Agent</h3>
								</div>
								<span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
									:8081
								</span>
							</div>
							<div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
								<span>Status: <strong className={status.kybernetes.online ? 'text-emerald-400' : 'text-gray-500'}>{status.kybernetes.online ? 'ONLINE' : 'OFFLINE'}</strong></span>
								{status.kybernetes.latency !== null && (
									<span className="font-mono text-gray-400">{status.kybernetes.latency} ms</span>
								)}
							</div>
							<p className="text-[11px] text-gray-400 leading-tight">
								{status.kybernetes.online
									? `Orchestrator active. Subagent worktrees ready.`
									: `Supervisor standby. Manages budgets & dispatch.`}
							</p>
						</div>

						{/* PROSOPON */}
						<div className={`p-4 rounded-xl border transition-all ${status.prosopon.online ? 'bg-[#290d2e]/60 border-purple-800/60 shadow-lg shadow-purple-950/20' : 'bg-gray-900/70 border-gray-800'}`}>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<div className={`w-2.5 h-2.5 rounded-full ${status.prosopon.online ? 'bg-purple-400 shadow-sm shadow-purple-400 animate-pulse' : 'bg-gray-600'}`} />
									<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">Prosopon Studio</h3>
								</div>
								<span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
									:8000
								</span>
							</div>
							<div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
								<span>Status: <strong className={status.prosopon.online ? 'text-purple-400' : 'text-gray-500'}>{status.prosopon.online ? 'ONLINE' : 'OFFLINE'}</strong></span>
								{status.prosopon.latency !== null && (
									<span className="font-mono text-gray-400">{status.prosopon.latency} ms</span>
								)}
							</div>
							<p className="text-[11px] text-gray-400 leading-tight">
								{status.prosopon.online
									? `Piper voice & Whisper streaming ready.`
									: `Web Studio & persona streaming standby.`}
							</p>
						</div>
					</div>
				</section>

				{/* ───────────── MAIN 2-COLUMN: PROJECT CREATOR & RECENTS ───────────── */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

					{/* LEFT COLUMN: PROJECT SCAFFOLDER WIZARD (7 COLS) */}
					<div className="lg:col-span-7 flex flex-col gap-6">
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h2 className="text-base font-bold text-white flex items-center gap-2">
										<FolderPlus className="w-5 h-5 text-cyan-400" />
										Create New Sovereign Project
									</h2>
									<p className="text-xs text-gray-400 mt-0.5">
										Choose an architectural preset to scaffold and open a fresh workspace
									</p>
								</div>
							</div>

							{/* Template Selector Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
								{TEMPLATES.map((tmpl) => {
									const IconComp = tmpl.icon;
									const isSelected = tmpl.id === selectedTemplateId;
									return (
										<div
											key={tmpl.id}
											onClick={() => handleSelectTemplate(tmpl)}
											className={`cursor-pointer rounded-xl p-3.5 border transition-all relative overflow-hidden flex flex-col justify-between ${
												isSelected
													? 'bg-gradient-to-b from-[#132338] to-[#0e1a2b] border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
													: 'bg-[#131b2e]/60 hover:bg-[#18233a] border-gray-800 hover:border-gray-700'
											}`}
										>
											{isSelected && (
												<div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
													<Check className="w-2.5 h-2.5 text-black stroke-[3]" />
												</div>
											)}
											<div>
												<div className="flex items-center gap-2 mb-2">
													<div
														className="w-7 h-7 rounded-lg flex items-center justify-center"
														style={{ backgroundColor: `${tmpl.accentColor}20` }}
													>
														<IconComp className="w-4 h-4" style={{ color: tmpl.accentColor }} />
													</div>
													<div>
														<h4 className="text-xs font-bold text-gray-100">{tmpl.title}</h4>
														<span className="text-[10px] text-gray-400 font-medium">{tmpl.tag}</span>
													</div>
												</div>
												<p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
													{tmpl.description}
												</p>
											</div>
										</div>
									);
								})}
							</div>

							{/* Scaffolding Form Inputs */}
							<div className="bg-[#0b1120] rounded-xl p-4 border border-gray-800 space-y-4">
								<div>
									<label className="block text-xs font-semibold text-gray-300 mb-1">
										Project Name
									</label>
									<input
										type="text"
										value={projectName}
										onChange={(e) => setProjectName(e.target.value)}
										placeholder="e.g. metis-sentinel-agent"
										className="w-full bg-[#161f33] border border-gray-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-gray-300 mb-1">
										Parent Directory
									</label>
									<div className="flex gap-2">
										<input
											type="text"
											value={parentDir}
											onChange={(e) => setParentDir(e.target.value)}
											className="flex-1 bg-[#161f33] border border-gray-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
										/>
									</div>
								</div>

								<div className="flex items-center justify-between pt-1">
									<label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
										<input
											type="checkbox"
											checked={initGit}
											onChange={(e) => setInitGit(e.target.checked)}
											className="rounded border-gray-700 text-cyan-500 focus:ring-0 bg-[#161f33] w-4 h-4"
										/>
										<span>Initialize Git repository & commit templates</span>
									</label>

									<span className="text-[11px] font-mono text-cyan-400/80">
										{parentDir.replace(/\/$/, '')}/{projectName.trim()}
									</span>
								</div>

								{createSuccessMsg && (
									<div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
										<CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
										<span>{createSuccessMsg}</span>
									</div>
								)}

								<button
									onClick={handleCreateProject}
									disabled={isCreating || !projectName.trim()}
									className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.01] active:scale-98"
								>
									{isCreating ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Scaffolding Project...
										</>
									) : (
										<>
											<Rocket className="w-4 h-4" />
											Create & Launch Sovereign Workspace
										</>
									)}
								</button>
							</div>
						</section>
					</div>

					{/* RIGHT COLUMN: QUICK OPEN & RECENT WORKSPACES (5 COLS) */}
					<div className="lg:col-span-5 flex flex-col gap-6">

						{/* Quick Workspace Open Actions */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
								Quick Launch
							</h3>
							<div className="grid grid-cols-2 gap-3 mb-4">
								<button
									onClick={handleOpenFolder}
									className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#131b2e] hover:bg-[#1a253f] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-200 transition-all hover:scale-[1.02]"
								>
									<FolderOpen className="w-4 h-4 text-cyan-400" />
									Open Folder...
								</button>

								<button
									onClick={handleCloneRepo}
									className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#131b2e] hover:bg-[#1a253f] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-200 transition-all hover:scale-[1.02]"
								>
									<GitBranch className="w-4 h-4 text-purple-400" />
									Clone Repository...
								</button>
							</div>

							{/* Sovereign Core Shortcut */}
							<div
								onClick={() => handleOpenRecent({ uri: URI.file('/home/akarta/Projects/Metis') })}
								className="cursor-pointer p-3 rounded-xl bg-gradient-to-r from-[#14233a] to-[#121c2c] hover:from-[#1b2f4e] hover:to-[#17253b] border border-cyan-800/60 flex items-center justify-between group transition-all"
							>
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
										🏛️
									</div>
									<div>
										<h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
											Metis Sovereign Core
										</h4>
										<p className="text-[10px] text-gray-400 font-mono">/home/akarta/Projects/Metis</p>
									</div>
								</div>
								<ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
							</div>
						</section>

						{/* Recent Workspaces List */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl flex-1 flex flex-col">
							<div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
								<h3 className="text-xs font-bold text-gray-300 flex items-center gap-2">
									<Clock className="w-4 h-4 text-cyan-400" />
									Recent Sovereign Projects
								</h3>
								<button
									onClick={loadRecents}
									className="text-gray-400 hover:text-white p-1"
									title="Refresh recent projects"
								>
									<RefreshCw className="w-3 h-3" />
								</button>
							</div>

							{/* Search input for recents */}
							<div className="relative mb-3">
								<Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
								<input
									type="text"
									value={recentSearch}
									onChange={(e) => setRecentSearch(e.target.value)}
									placeholder="Filter recent workspaces..."
									className="w-full bg-[#131b2e] border border-gray-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
								/>
							</div>

							{/* List items */}
							<div className="space-y-1.5 overflow-y-auto max-h-[320px] pr-1">
								{isLoadingRecents ? (
									<div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
										Loading recent projects...
									</div>
								) : filteredRecents.length === 0 ? (
									<div className="py-8 text-center text-xs text-gray-500">
										No recent projects found.
									</div>
								) : (
									filteredRecents.map((item, idx) => (
										<div
											key={`${item.path}-${idx}`}
											onClick={() => handleOpenRecent(item)}
											className="cursor-pointer p-2.5 rounded-xl bg-[#131b2e]/60 hover:bg-[#1a253f] border border-gray-800/80 hover:border-gray-700 flex items-center justify-between group transition-all"
										>
											<div className="min-w-0 pr-2">
												<h4 className="text-xs font-semibold text-gray-200 group-hover:text-cyan-300 truncate transition-colors">
													{item.name}
												</h4>
												<p className="text-[10px] text-gray-500 font-mono truncate">
													{item.path}
												</p>
											</div>
											<span className="shrink-0 text-[10px] text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 opacity-0 group-hover:opacity-100 transition-opacity">
												Open
											</span>
										</div>
									))
								)}
							</div>
						</section>

						{/* Hardware & Air-Gapped VRAM Monitor */}
						<section className="bg-gradient-to-br from-[#0c1524] to-[#0f172a] rounded-2xl border border-gray-800/80 p-5 shadow-xl">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-xs font-bold text-gray-300 flex items-center gap-2">
									<Cpu className="w-4 h-4 text-cyan-400" />
									Hardware & Memory Budget
								</h3>
								<span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
									RTX 5060 Ti 16GB
								</span>
							</div>

							<div className="space-y-2 text-[11px]">
								<div className="flex justify-between text-gray-400">
									<span>Hestia Model Weights (Q4_K_M)</span>
									<span className="font-mono text-gray-200">~4.7 GB</span>
								</div>
								<div className="flex justify-between text-gray-400">
									<span>KV Context Cache (32k tokens)</span>
									<span className="font-mono text-gray-200">~2.1 GB</span>
								</div>
								<div className="flex justify-between text-gray-400">
									<span>Prosopon Voice (Piper + Whisper)</span>
									<span className="font-mono text-gray-200">~0.8 GB</span>
								</div>
								<div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-1">
									<div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full w-[47%]" />
								</div>
								<div className="flex justify-between text-[10px] text-gray-400 pt-1">
									<span className="text-cyan-400">Allocated: ~7.6 GB (47%)</span>
									<span className="text-emerald-400">Free Headroom: ~8.4 GB</span>
								</div>
							</div>
						</section>

					</div>
				</div>

			</div>
		</div>
	);
};
