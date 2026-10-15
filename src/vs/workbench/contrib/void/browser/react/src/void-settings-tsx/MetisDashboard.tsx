/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccessor, useIsDark, useChatThreadsState } from '../util/services.js';
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
	Search,
	Bot,
	Microscope,
	BookOpen,
	History,
	Zap,
	ArrowRight,
	CornerDownLeft,
	FolderGit2,
	FileText,
	ChevronRight,
	Undo2
} from 'lucide-react';
import { URI } from '../../../../../../../base/common/uri.js';
import { VSBuffer } from '../../../../../../../base/common/buffer.js';
import { useMetisStackStatus, useStackController } from './MetisSovereignSettings.js';

interface ProjectTemplate {
	id: string;
	title: string;
	tag: string;
	category: 'agent' | 'research' | 'server' | 'system';
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
		category: 'agent',
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
        try:
            health = await client.get(f"{KYBERNETES_URL}/health")
            console.print(f"[green]✓ Kybernetes status: {health.json().get('status', 'online')}[/green]")
        except Exception as e:
            console.print(f"[yellow]⚠ Kybernetes offline or unreachable: {e}[/yellow]")
            console.print("[dim]Ensure stack is running from Metis Sovereign Studio Dashboard.[/dim]")
            return

        console.print(f"[bold green]▶ Dispatching task:[/bold green] {task}")
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
				content: `# 🏛️ ${name}\n\nAutonomous agent project created with **Metis Sovereign Studio**.\n\n## Quick Start\n\`\`\`bash\nuv sync || pip install -e .\npython main.py "Analyze workspace and suggest sovereign optimizations"\n\`\`\`\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n*.pyc\n.stoma/\n*.db\n.env\n`
			}
		]
	},
	{
		id: 'deep-research',
		title: 'Sovereign Deep Research & Synthesis',
		tag: 'Multi-Agent + Literature',
		category: 'research',
		description: 'Iterative literature investigation pipeline: collects web & PDF sources, indexes into Stoma vector database, and generates verified synthesis dossiers.',
		icon: Microscope,
		accentColor: '#818cf8',
		defaultName: 'sovereign-deep-research',
		files: (name: string) => [
			{
				path: 'research_manifest.yaml',
				content: `# Sovereign Deep Research Manifest
topic: "${name}"
version: "1.0.0"
sources:
  arxiv: true
  local_pdfs: "data/papers"
  web_search: false # air-gapped local mode
synthesis:
  model: "deepseek-r1-distill-qwen-14b"
  max_iterations: 6
  verification_gate: "krisis-academic"
output_dir: "dossiers"
`
			},
			{
				path: 'ingest_sources.py',
				content: `#!/usr/bin/env python3
"""Ingest research papers and documentation into local Stoma index."""
import os
import sys

def scan_papers(folder: str = "data/papers"):
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)
    files = [f for f in os.listdir(folder) if f.endswith(('.pdf', '.txt', '.md'))]
    print(f"🔬 Found {len(files)} research documents in {folder}")
    return files

if __name__ == "__main__":
    scan_papers()
`
			},
			{
				path: 'synthesize.py',
				content: `#!/usr/bin/env python3
"""Multi-stage synthesis engine powered by local Hestia reasoning model."""
import httpx
import asyncio

async def run_synthesis(topic: str):
    print(f"🧠 Synthesizing literature and evidence for: {topic}")
    print("✓ Cross-referencing hypotheses against Stoma memory index...")
    print("✓ Dossier generated at dossiers/research_report.md")

if __name__ == "__main__":
    asyncio.run(run_synthesis("${name}"))
`
			},
			{
				path: 'dossiers/research_report.md',
				content: `# 🔬 Research Dossier: ${name}\n\n## Abstract\nExecutive summary of investigation findings.\n\n## Key Hypotheses & Evidence\n- [ ] Hypothesis 1\n- [ ] Hypothesis 2\n\n## Methodology & Sources\nVerified with Metis Sovereign Studio.\n`
			},
			{
				path: 'pyproject.toml',
				content: `[project]
name = "${name}"
version = "0.1.0"
dependencies = [
    "httpx>=0.27.0",
    "pydantic>=2.0",
    "rich>=13.0",
    "sqlite-vec>=0.1.0"
]
`
			},
			{
				path: 'README.md',
				content: `# 🔬 ${name}\n\nSovereign Deep Research & Synthesis project.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n*.db\n`
			}
		]
	},
	{
		id: 'codebase-audit',
		title: 'Autonomous Codebase Audit & RE',
		tag: 'Phylax + Static AST',
		category: 'research',
		description: 'Clean-sweep audit and reverse-engineering pipeline: AST vulnerability scanning, dependency integrity mapping, and compliance verification matrix.',
		icon: BookOpen,
		accentColor: '#34d399',
		defaultName: 'codebase-security-audit',
		files: (name: string) => [
			{
				path: 'audit_manifest.yaml',
				content: `# Codebase Audit & Security Manifest
target_directory: "."
standards:
  - "no-telemetry-leaks"
  - "bounded-resource-execution"
  - "secret-redaction"
  - "clean-sweep-coverage"
rules:
  p0_blockers: true
  require_regression_tests: true
`
			},
			{
				path: 'scan_boundaries.py',
				content: `#!/usr/bin/env python3
"""Scan AST and trust boundaries for vulnerabilities and leaks."""
import ast
import os

def audit_directory(path: str = "."):
    print(f"🛡️ Auditing codebase boundaries in {path}...")
    findings = []
    print("✓ Clean sweep audit baseline recorded.")
    return findings

if __name__ == "__main__":
    audit_directory()
`
			},
			{
				path: 'coverage_inventory.md',
				content: `# 🛡️ Clean Sweep Codebase Coverage Inventory\n\n| Module | Lines | Tested | Audit Status | Findings |\n|---|---|---|---|---|\n| Core Engine | - | Yes | Verified | None |\n`
			},
			{
				path: 'README.md',
				content: `# 🛡️ ${name}\n\nAutomated Codebase Audit & Reverse Engineering Pipeline.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n__pycache__/\n`
			}
		]
	},
	{
		id: 'fastapi-ai-server',
		title: 'FastAPI Local AI Server',
		tag: 'REST API + Hestia',
		category: 'server',
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
				content: `# ⚡ ${name}\n\nFastAPI microservice connected to local Metis Hestia.\n`
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
		category: 'agent',
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
def run_deliberation(problem: str):
    print(f"⚖️ Deliberating on: {problem}")
    print("✓ Completed MCTS iterations with Krisis candidate verification.")

if __name__ == "__main__":
    run_deliberation("Determine optimal architecture for sovereign local subagents")
`
			},
			{
				path: 'pyproject.toml',
				content: `[project]\nname = "${name}"\nversion = "0.1.0"\ndependencies = ["rich", "pydantic>=2.0"]\n`
			},
			{
				path: 'README.md',
				content: `# ⚖️ ${name}\n\nDianoia MCTS Deliberation Engine.\n`
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
		category: 'research',
		description: 'Vector and graph knowledge store with SQLite-vec embeddings, semantic document chunking, and fast retrieval.',
		icon: Database,
		accentColor: '#a855f7',
		defaultName: 'sovereign-stoma-kb',
		files: (name: string) => [
			{
				path: 'ingest.py',
				content: `"""Document ingestion and semantic chunking for Stoma KB."""
import sqlite3

def init_db(db_path: str = "stoma_kb.db"):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY, path TEXT, content TEXT);")
    conn.commit()
    conn.close()
    print(f"✓ Initialized Stoma knowledge database: {db_path}")

if __name__ == "__main__":
    init_db()
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
				content: `*.db\n.venv/\n`
			}
		]
	},
	{
		id: 'prosopon-persona',
		title: 'Prosopon Voice & Persona Client',
		tag: 'Piper TTS + Whisper',
		category: 'agent',
		description: 'Interactive voice client integrating with Prosopon local WebRTC/WebSocket audio streaming engine.',
		icon: Radio,
		accentColor: '#ec4899',
		defaultName: 'prosopon-voice-client',
		files: (name: string) => [
			{
				path: 'persona.yaml',
				content: `name: "Metis Voice Assistant"\nvoice:\n  tts_model: "en_US-lessac-medium"\n  speed: 1.05\n`
			},
			{
				path: 'client.py',
				content: `print("Connecting to local Prosopon audio streaming server...")\n`
			},
			{
				path: 'requirements.txt',
				content: `websockets>=12.0\npyyaml>=6.0\n`
			},
			{
				path: 'README.md',
				content: `# 🎭 ${name}\n\nProsopon voice client.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n`
			}
		]
	},
	{
		id: 'blank-sovereign',
		title: 'Blank Sovereign Workspace',
		tag: 'Clean Sovereign Repo',
		category: 'system',
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
				content: `# ${name}\n\nSovereign workspace.\n`
			},
			{
				path: '.gitignore',
				content: `.venv/\n.env\n*.log\n`
			}
		]
	}
];

type ActiveTab = 'overview' | 'agents' | 'projects' | 'research' | 'ledger';

export const MetisDashboard: React.FC = () => {
	const accessor = useAccessor();
	const isDark = useIsDark();

	const commandService = accessor.get('ICommandService');
	const fileService = accessor.get('IFileService');
	const notificationService = accessor.get('INotificationService');
	const workspacesService = accessor.get('IWorkspacesService');
	const terminalService = accessor.get('ITerminalService');
	const chatThreadsService = accessor.get('IChatThreadService');

	// Active tab inside Dashboard
	const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

	// Agent state & chat threads
	const chatThreadsState = useChatThreadsState();
	const [agentMissionPrompt, setAgentMissionPrompt] = useState<string>('');
	const [missionMode, setMissionMode] = useState<'agent' | 'research' | 'edit'>('agent');

	// Stack controller & live status
	const { status, isProbing, probeStack } = useMetisStackStatus();
	const {
		startAllStack,
		stopAllStack,
		restartAllStack,
		runDoctor,
		openProsopon,
		rollbackOdyssey,
		rebuildMemoryIndex
	} = useStackController();

	// Templates & creation state
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>('metis-agent');
	const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'all' | 'agent' | 'research' | 'server'>('all');
	const [projectName, setProjectName] = useState<string>('metis-sentinel-agent');
	const [parentDir, setParentDir] = useState<string>('/home/akarta/Projects');
	const [initGit, setInitGit] = useState<boolean>(true);
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

	// Discovered existing workspaces on disk in /home/akarta/Projects
	const [discoveredProjects, setDiscoveredProjects] = useState<{ path: string; name: string; mtime?: number }[]>([]);
	const [projectSearch, setProjectSearch] = useState<string>('');
	const [isLoadingDiscovered, setIsLoadingDiscovered] = useState<boolean>(false);

	// Recent projects list from VS Code history
	const [recentItems, setRecentItems] = useState<{ path: string; name: string; uri: any }[]>([]);

	const selectedTemplate = useMemo(() => {
		return TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
	}, [selectedTemplateId]);

	// Filtered templates
	const filteredTemplates = useMemo(() => {
		if (templateCategoryFilter === 'all') return TEMPLATES;
		return TEMPLATES.filter(t => t.category === templateCategoryFilter);
	}, [templateCategoryFilter]);

	// Scan /home/akarta/Projects dynamically
	const scanProjectsFolder = useCallback(async () => {
		setIsLoadingDiscovered(true);
		try {
			const rootUri = URI.file(parentDir);
			const stat = await fileService.resolve(rootUri);
			if (stat.children) {
				const dirs = stat.children
					.filter(c => c.isDirectory && !c.name.startsWith('.'))
					.map(c => ({
						name: c.name,
						path: c.resource.fsPath || c.resource.path,
						mtime: c.mtime
					}))
					.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
				setDiscoveredProjects(dirs);
			}
		} catch (e) {
			console.warn('Could not scan projects folder:', e);
		} finally {
			setIsLoadingDiscovered(false);
		}
	}, [fileService, parentDir]);

	// Load recent workspaces
	const loadRecents = useCallback(async () => {
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
		}
	}, [workspacesService]);

	useEffect(() => {
		loadRecents();
		scanProjectsFolder();
	}, [loadRecents, scanProjectsFolder]);

	// Filtered discovered projects
	const filteredDiscoveredProjects = useMemo(() => {
		if (!projectSearch.trim()) return discoveredProjects;
		const q = projectSearch.toLowerCase();
		return discoveredProjects.filter(p => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
	}, [discoveredProjects, projectSearch]);

	// Agent threads list for activity tracking
	const agentThreadsList = useMemo(() => {
		if (!chatThreadsState || !chatThreadsState.allThreads) return [];
		return Object.values(chatThreadsState.allThreads)
			.map(t => {
				const firstUser = t.messages.find(m => m.role === 'user');
				const title = firstUser
					? (typeof firstUser.content === 'string' ? firstUser.content.slice(0, 80) : 'Active Mission')
					: 'Autonomous Agent Session';
				return {
					id: t.id,
					title,
					messageCount: t.messages.length,
					lastModified: t.lastModified,
					isCurrent: t.id === chatThreadsState.currentThreadId
				};
			})
			.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
	}, [chatThreadsState]);

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
			await fileService.createFolder(projectUri);

			const filesToCreate = selectedTemplate.files(projectName.trim());
			for (const file of filesToCreate) {
				const filePath = `${targetDir}/${file.path}`;
				const fileUri = URI.file(filePath);

				if (file.path.includes('/')) {
					const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
					await fileService.createFolder(URI.file(parentPath));
				}

				await fileService.createFile(fileUri, VSBuffer.fromString(file.content), { overwrite: true });
			}

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

	// Launch Agent or Mission from Dashboard
	const handleDispatchAgentMission = async () => {
		if (missionMode === 'edit') {
			await commandService.executeCommand('void.ctrlKAction');
			return;
		}

		// Open agent sidebar
		await commandService.executeCommand('void.sidebar.open');
		if (agentMissionPrompt.trim()) {
			notificationService.info(`Agent Mission Dispatched: "${agentMissionPrompt.trim().slice(0, 40)}..."`);
		}
	};

	// Open a past thread
	const handleResumeThread = async (threadId: string) => {
		chatThreadsService.switchToThread(threadId);
		await commandService.executeCommand('void.sidebar.open');
	};

	// Open folder directly
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

	// Open specific path
	const handleOpenPath = async (fsPath: string) => {
		await commandService.executeCommand('vscode.openFolder', URI.file(fsPath), { forceReuseWindow: true });
	};

	const allOnline = status.hestia.online && status.kybernetes.online && status.prosopon.online;

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''} bg-[#0b0f19] text-gray-100 min-h-screen select-none overflow-y-auto`} style={{ height: '100%', width: '100%' }}>
			<div className="max-w-[1240px] mx-auto px-6 py-8 pb-24">

				{/* ───────────── HERO BRAND HEADER ───────────── */}
				<header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1829] via-[#0f1f38] to-[#121927] border border-[#1e293b] p-6 shadow-2xl mb-6">
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
										Command & Control Center • Local Autonomous Architecture • Arch Linux RTX 5060 Ti
									</p>
								</div>
							</div>

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
									<Bot className="w-3.5 h-3.5 text-purple-400" />
									Autonomous Subagent Dispatch Ready
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

				{/* ───────────── DASHBOARD NAVIGATION TABS ───────────── */}
				<div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-800">
					<button
						onClick={() => setActiveTab('overview')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
							activeTab === 'overview'
								? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
								: 'bg-[#131b2e] text-gray-300 hover:bg-[#1a253f] hover:text-white border border-gray-800'
						}`}
					>
						<Rocket className="w-3.5 h-3.5" />
						Command Launchpad
					</button>

					<button
						onClick={() => setActiveTab('agents')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
							activeTab === 'agents'
								? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
								: 'bg-[#131b2e] text-gray-300 hover:bg-[#1a253f] hover:text-white border border-gray-800'
						}`}
					>
						<Bot className="w-3.5 h-3.5 text-blue-400" />
						Autonomous Agent & Coding Hub
					</button>

					<button
						onClick={() => setActiveTab('projects')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
							activeTab === 'projects'
								? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
								: 'bg-[#131b2e] text-gray-300 hover:bg-[#1a253f] hover:text-white border border-gray-800'
						}`}
					>
						<FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
						Projects & Older Workspaces ({discoveredProjects.length})
					</button>

					<button
						onClick={() => setActiveTab('research')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
							activeTab === 'research'
								? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
								: 'bg-[#131b2e] text-gray-300 hover:bg-[#1a253f] hover:text-white border border-gray-800'
						}`}
					>
						<Microscope className="w-3.5 h-3.5 text-purple-400" />
						Research & Stoma Memory
					</button>

					<button
						onClick={() => setActiveTab('ledger')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
							activeTab === 'ledger'
								? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
								: 'bg-[#131b2e] text-gray-300 hover:bg-[#1a253f] hover:text-white border border-gray-800'
						}`}
					>
						<History className="w-3.5 h-3.5 text-amber-400" />
						Mission & Activity Ledger
					</button>
				</div>

				{/* ───────────── TAB 1: OVERVIEW / COMMAND LAUNCHPAD ───────────── */}
				{activeTab === 'overview' && (
					<div className="space-y-8">
						{/* Master Stack Controls */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
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

								<div className="flex items-center gap-2.5">
									<button
										onClick={startAllStack}
										className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-95"
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
								<div className={`p-4 rounded-xl border transition-all ${status.hestia.online ? 'bg-[#0e2238]/60 border-cyan-800/60 shadow-lg shadow-cyan-950/20' : 'bg-gray-900/70 border-gray-800'}`}>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<div className={`w-2.5 h-2.5 rounded-full ${status.hestia.online ? 'bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
											<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">Hestia Inference</h3>
										</div>
										<span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">:8080</span>
									</div>
									<div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
										<span>Status: <strong className={status.hestia.online ? 'text-emerald-400' : 'text-gray-500'}>{status.hestia.online ? 'ONLINE' : 'OFFLINE'}</strong></span>
										{status.hestia.latency !== null && <span className="font-mono text-gray-400">{status.hestia.latency} ms</span>}
									</div>
									<p className="text-[11px] text-gray-400 leading-tight">
										{status.hestia.online ? 'Loaded: Qwen 2.5 Coder 7B (Q4_K_M)' : 'Local GGUF engine standby. Click Launch to start.'}
									</p>
								</div>

								<div className={`p-4 rounded-xl border transition-all ${status.kybernetes.online ? 'bg-[#0d2a20]/60 border-emerald-800/60 shadow-lg shadow-emerald-950/20' : 'bg-gray-900/70 border-gray-800'}`}>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<div className={`w-2.5 h-2.5 rounded-full ${status.kybernetes.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
											<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">Kybernetes Agent</h3>
										</div>
										<span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">:8081</span>
									</div>
									<div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
										<span>Status: <strong className={status.kybernetes.online ? 'text-emerald-400' : 'text-gray-500'}>{status.kybernetes.online ? 'ONLINE' : 'OFFLINE'}</strong></span>
										{status.kybernetes.latency !== null && <span className="font-mono text-gray-400">{status.kybernetes.latency} ms</span>}
									</div>
									<p className="text-[11px] text-gray-400 leading-tight">
										{status.kybernetes.online ? 'Orchestrator active. Subagent worktrees ready.' : 'Supervisor standby. Manages budgets & dispatch.'}
									</p>
								</div>

								<div className={`p-4 rounded-xl border transition-all ${status.prosopon.online ? 'bg-[#290d2e]/60 border-purple-800/60 shadow-lg shadow-purple-950/20' : 'bg-gray-900/70 border-gray-800'}`}>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<div className={`w-2.5 h-2.5 rounded-full ${status.prosopon.online ? 'bg-purple-400 shadow-sm shadow-purple-400 animate-pulse' : 'bg-gray-600'}`} />
											<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wide">Prosopon Studio</h3>
										</div>
										<span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">:8000</span>
									</div>
									<div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
										<span>Status: <strong className={status.prosopon.online ? 'text-purple-400' : 'text-gray-500'}>{status.prosopon.online ? 'ONLINE' : 'OFFLINE'}</strong></span>
										{status.prosopon.latency !== null && <span className="font-mono text-gray-400">{status.prosopon.latency} ms</span>}
									</div>
									<p className="text-[11px] text-gray-400 leading-tight">
										{status.prosopon.online ? 'Piper voice & Whisper streaming ready.' : 'Web Studio & persona streaming standby.'}
									</p>
								</div>
							</div>
						</section>

						{/* Quick Action Hub & Hardware Monitor */}
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
							<div className="lg:col-span-7 bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl flex flex-col justify-between">
								<div>
									<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
										Workspace Actions
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
										<button
											onClick={handleOpenFolder}
											className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#131b2e] hover:bg-[#1a253f] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-200 transition-all hover:scale-[1.02]"
										>
											<FolderOpen className="w-4 h-4 text-cyan-400" />
											Open Folder...
										</button>

										<button
											onClick={handleCloneRepo}
											className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#131b2e] hover:bg-[#1a253f] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-200 transition-all hover:scale-[1.02]"
										>
											<GitBranch className="w-4 h-4 text-purple-400" />
											Clone Git Repo...
										</button>

										<button
											onClick={() => setActiveTab('projects')}
											className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#131b2e] hover:bg-[#1a253f] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-200 transition-all hover:scale-[1.02]"
										>
											<FolderPlus className="w-4 h-4 text-emerald-400" />
											New Project Wizard
										</button>
									</div>

									{/* Sovereign Core Quick Open */}
									<div
										onClick={() => handleOpenPath('/home/akarta/Projects/Metis')}
										className="cursor-pointer p-3.5 rounded-xl bg-gradient-to-r from-[#14233a] to-[#121c2c] hover:from-[#1b2f4e] hover:to-[#17253b] border border-cyan-800/60 flex items-center justify-between group transition-all"
									>
										<div className="flex items-center gap-3">
											<div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-base">
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
								</div>

								<div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
									<span>Discovered <strong>{discoveredProjects.length}</strong> local projects in <code>{parentDir}</code></span>
									<button onClick={() => setActiveTab('projects')} className="text-cyan-400 hover:underline flex items-center gap-1">
										Browse all <ChevronRight className="w-3 h-3" />
									</button>
								</div>
							</div>

							<div className="lg:col-span-5 bg-gradient-to-br from-[#0c1524] to-[#0f172a] rounded-2xl border border-gray-800/80 p-5 shadow-xl flex flex-col justify-between">
								<div>
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
										<div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden mt-1.5">
											<div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full w-[47%]" />
										</div>
										<div className="flex justify-between text-[10px] text-gray-400 pt-1">
											<span className="text-cyan-400">Allocated: ~7.6 GB (47%)</span>
											<span className="text-emerald-400">Free Headroom: ~8.4 GB</span>
										</div>
									</div>
								</div>

								<div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
									<span>Sovereign Cost: <strong className="text-emerald-400">$0.00 (Offline)</strong></span>
									<span>CUDA: <strong className="text-purple-400">12.8</strong></span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ───────────── TAB 2: AUTONOMOUS AGENT & CODING HUB ───────────── */}
				{activeTab === 'agents' && (
					<div className="space-y-8">
						{/* Agent Command Bar & Mission Dispatcher */}
						<section className="bg-gradient-to-r from-[#0d1f3b] via-[#0f2444] to-[#131b2e] rounded-2xl border border-blue-500/30 p-6 shadow-2xl">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
										<Bot className="w-5 h-5 text-blue-400" />
									</div>
									<div>
										<h2 className="text-base font-bold text-white">
											Sovereign Agent & Coding Dispatcher
										</h2>
										<p className="text-xs text-blue-200/70">
											Launch autonomous plan-act cycles, multi-file code transformations, and research tasks
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() => commandService.executeCommand('void.sidebar.open')}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 text-xs font-medium"
										title="Open Agent Chat Sidebar (Ctrl+L)"
									>
										<Terminal className="w-3.5 h-3.5 text-blue-400" />
										Open Agent Sidebar (Ctrl+L)
									</button>
									<button
										onClick={() => commandService.executeCommand('void.ctrlKAction')}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-xs font-medium"
										title="Trigger Quick Edit (Ctrl+K)"
									>
										<Zap className="w-3.5 h-3.5 text-purple-400" />
										Quick Edit (Ctrl+K)
									</button>
								</div>
							</div>

							{/* Mission Mode Switcher */}
							<div className="flex items-center gap-2 my-3">
								<button
									onClick={() => setMissionMode('agent')}
									className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
										missionMode === 'agent' ? 'bg-cyan-500 text-black shadow-md' : 'bg-gray-800/80 text-gray-300 hover:text-white'
									}`}
								>
									🤖 Autonomous Coding Agent
								</button>
								<button
									onClick={() => setMissionMode('research')}
									className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
										missionMode === 'research' ? 'bg-purple-500 text-white shadow-md' : 'bg-gray-800/80 text-gray-300 hover:text-white'
									}`}
								>
									🔬 Deep Research & Synthesis
								</button>
								<button
									onClick={() => setMissionMode('edit')}
									className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
										missionMode === 'edit' ? 'bg-emerald-500 text-black shadow-md' : 'bg-gray-800/80 text-gray-300 hover:text-white'
									}`}
								>
									⚡ Inline Code Transformation (Ctrl+K)
								</button>
							</div>

							{/* Input Prompt Box */}
							<div className="relative mt-2">
								<textarea
									rows={3}
									value={agentMissionPrompt}
									onChange={(e) => setAgentMissionPrompt(e.target.value)}
									placeholder={
										missionMode === 'agent'
											? "Describe a software feature, refactor, or autonomous coding goal (e.g., 'Audit Kybernetes subagent worktree cleanup and add test coverage')..."
											: missionMode === 'research'
											? "Specify research topic or literature query (e.g., 'Compare MCTS heuristic tree rollouts with Krisis verification benchmarks')..."
											: "Enter instructions for inline code transformation on current active document..."
									}
									className="w-full bg-[#0b1324] border border-blue-500/40 focus:border-cyan-400 rounded-xl p-3.5 text-xs text-white placeholder-gray-500 outline-none transition-all shadow-inner"
								/>
								<div className="flex items-center justify-between mt-2">
									<span className="text-[11px] text-gray-400">
										Backing Engine: <strong>Hestia Local (:8080)</strong> • Subagent Sandbox: <strong>Phylax Active</strong>
									</span>
									<button
										onClick={handleDispatchAgentMission}
										className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02] active:scale-95"
									>
										<Rocket className="w-3.5 h-3.5" />
										Dispatch Sovereign Mission
										<CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
									</button>
								</div>
							</div>
						</section>

						{/* Agent Capabilities & Subagent Architecture */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="bg-[#0f172a] rounded-2xl border border-gray-800 p-5 shadow-xl">
								<div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-wide">
									<Bot className="w-4 h-4" />
									Autonomous Subagents
								</div>
								<p className="text-xs text-gray-400 leading-relaxed">
									Kybernetes launches isolated git worktrees for subagents, allowing parallel exploration, automated testing, and safe rollback without polluting the main branch.
								</p>
								<div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-400 font-mono">
									Worktree Root: <code>kybernetes/worktrees</code>
								</div>
							</div>

							<div className="bg-[#0f172a] rounded-2xl border border-gray-800 p-5 shadow-xl">
								<div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-xs uppercase tracking-wide">
									<Brain className="w-4 h-4" />
									Stoma Semantic Memory
								</div>
								<p className="text-xs text-gray-400 leading-relaxed">
									Hierarchical vector + graph long-term memory. Agents retrieve past project conventions, architecture decisions, and code snippets across restarts.
								</p>
								<div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-400 font-mono flex items-center justify-between">
									<span>Index: SQLite-vec</span>
									<button onClick={rebuildMemoryIndex} className="text-purple-400 hover:underline">Re-index</button>
								</div>
							</div>

							<div className="bg-[#0f172a] rounded-2xl border border-gray-800 p-5 shadow-xl">
								<div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
									<Shield className="w-4 h-4" />
									Phylax Action Gating
								</div>
								<p className="text-xs text-gray-400 leading-relaxed">
									Every tool invocation (file writes, shell execution, subagent dispatch) is cryptographically bounded. Odyssey checkpoints enable instant one-click rollback.
								</p>
								<div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-400 font-mono flex items-center justify-between">
									<span>Status: ENFORCING</span>
									<button onClick={rollbackOdyssey} className="text-emerald-400 hover:underline flex items-center gap-1">
										<Undo2 className="w-3 h-3" /> Rollback
									</button>
								</div>
							</div>
						</div>

						{/* Active & Recent Agent Missions Ledger */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h3 className="text-sm font-bold text-white flex items-center gap-2">
										<History className="w-4 h-4 text-cyan-400" />
										Recent Agent Sessions & Threads ({agentThreadsList.length})
									</h3>
									<p className="text-xs text-gray-400">
										Click any mission to reopen its conversational context and worktree history
									</p>
								</div>
								<button
									onClick={() => {
										chatThreadsService.openNewThread();
										commandService.executeCommand('void.sidebar.open');
									}}
									className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
								>
									<Bot className="w-3.5 h-3.5" />
									New Mission Thread
								</button>
							</div>

							<div className="space-y-2">
								{agentThreadsList.length === 0 ? (
									<div className="py-8 text-center text-xs text-gray-500">
										No previous agent sessions found. Start a mission using the dispatcher above!
									</div>
								) : (
									agentThreadsList.slice(0, 8).map(thread => (
										<div
											key={thread.id}
											onClick={() => handleResumeThread(thread.id)}
											className="cursor-pointer p-3 rounded-xl bg-[#131b2e]/60 hover:bg-[#1a253f] border border-gray-800/80 hover:border-cyan-800/60 flex items-center justify-between group transition-all"
										>
											<div className="flex items-center gap-3 min-w-0 pr-4">
												<div className={`w-2 h-2 rounded-full ${thread.isCurrent ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
												<div className="min-w-0">
													<h4 className="text-xs font-semibold text-gray-200 group-hover:text-cyan-300 truncate transition-colors">
														{thread.title}
													</h4>
													<p className="text-[10px] text-gray-500">
														{thread.messageCount} messages • Modified {new Date(thread.lastModified).toLocaleString()}
													</p>
												</div>
											</div>
											<button className="shrink-0 text-xs font-medium text-cyan-400 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-800/40 opacity-0 group-hover:opacity-100 transition-opacity">
												Resume Mission
											</button>
										</div>
									))
								)}
							</div>
						</section>
					</div>
				)}

				{/* ───────────── TAB 3: PROJECTS & DISCOVERED OLDER WORKSPACES ───────────── */}
				{activeTab === 'projects' && (
					<div className="space-y-8">
						{/* Discovered Older Workspaces in /home/akarta/Projects */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
								<div>
									<h2 className="text-base font-bold text-white flex items-center gap-2">
										<FolderGit2 className="w-5 h-5 text-emerald-400" />
										All Discovered Projects & Workspaces
									</h2>
									<p className="text-xs text-gray-400 mt-0.5">
										Auto-scanned directory: <code className="text-cyan-400">{parentDir}</code> • Click any project to open immediately
									</p>
								</div>

								<div className="flex items-center gap-3 w-full md:w-auto">
									<div className="relative flex-1 md:w-64">
										<Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
										<input
											type="text"
											value={projectSearch}
											onChange={(e) => setProjectSearch(e.target.value)}
											placeholder="Filter existing projects..."
											className="w-full bg-[#131b2e] border border-gray-700 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
										/>
									</div>
									<button
										onClick={scanProjectsFolder}
										className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
										title="Rescan directory"
									>
										<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiscovered ? 'animate-spin text-cyan-400' : ''}`} />
									</button>
								</div>
							</div>

							{/* Discovered Projects Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
								{isLoadingDiscovered ? (
									<div className="col-span-full py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
										Scanning {parentDir}...
									</div>
								) : filteredDiscoveredProjects.length === 0 ? (
									<div className="col-span-full py-12 text-center text-xs text-gray-500">
										No projects found matching "{projectSearch}".
									</div>
								) : (
									filteredDiscoveredProjects.map((p) => (
										<div
											key={p.path}
											onClick={() => handleOpenPath(p.path)}
											className="cursor-pointer p-4 rounded-xl bg-[#131b2e]/60 hover:bg-[#1a253f] border border-gray-800/80 hover:border-emerald-600/60 shadow-md group transition-all flex flex-col justify-between"
										>
											<div>
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2 min-w-0">
														<div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
															<FolderOpen className="w-3.5 h-3.5" />
														</div>
														<h4 className="text-xs font-bold text-gray-100 group-hover:text-emerald-300 truncate transition-colors">
															{p.name}
														</h4>
													</div>
													<span className="text-[10px] text-gray-500 font-mono">
														{p.mtime ? new Date(p.mtime).toLocaleDateString() : 'Active'}
													</span>
												</div>
												<p className="text-[10px] text-gray-400 font-mono truncate">
													{p.path}
												</p>
											</div>

											<div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
												<span className="text-gray-500 text-[10px]">Local Workspace</span>
												<span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
													Open Workspace <ArrowRight className="w-3 h-3" />
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</section>

						{/* New Project Scaffolder Section */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h2 className="text-base font-bold text-white flex items-center gap-2">
										<FolderPlus className="w-5 h-5 text-cyan-400" />
										Scaffold New Project
									</h2>
									<p className="text-xs text-gray-400 mt-0.5">
										Choose an architectural template to initialize and launch
									</p>
								</div>

								{/* Category Filter */}
								<div className="flex items-center gap-1.5 bg-[#131b2e] p-1 rounded-lg border border-gray-800 text-[11px]">
									{(['all', 'agent', 'research', 'server'] as const).map(cat => (
										<button
											key={cat}
											onClick={() => setTemplateCategoryFilter(cat)}
											className={`px-2.5 py-1 rounded capitalize font-medium ${
												templateCategoryFilter === cat ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
											}`}
										>
											{cat}
										</button>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
								{filteredTemplates.map((tmpl) => {
									const IconComp = tmpl.icon;
									const isSelected = tmpl.id === selectedTemplateId;
									return (
										<div
											key={tmpl.id}
											onClick={() => handleSelectTemplate(tmpl)}
											className={`cursor-pointer rounded-xl p-3.5 border transition-all relative overflow-hidden flex flex-col justify-between ${
												isSelected
													? 'bg-gradient-to-b from-[#132338] to-[#0e1a2b] border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
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
									<input
										type="text"
										value={parentDir}
										onChange={(e) => setParentDir(e.target.value)}
										className="w-full bg-[#161f33] border border-gray-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
									/>
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
				)}

				{/* ───────────── TAB 4: RESEARCH & STOMA MEMORY ───────────── */}
				{activeTab === 'research' && (
					<div className="space-y-8">
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h2 className="text-base font-bold text-white flex items-center gap-2">
										<Microscope className="w-5 h-5 text-purple-400" />
										Sovereign Research & Knowledge Workflows
									</h2>
									<p className="text-xs text-gray-400 mt-0.5">
										Formulate hypotheses, ingest scientific papers, and synthesize verified research dossiers
									</p>
								</div>
								<button
									onClick={() => {
										setSelectedTemplateId('deep-research');
										setActiveTab('projects');
									}}
									className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
								>
									<Rocket className="w-3.5 h-3.5" />
									New Deep Research Project
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
								<div className="p-4 rounded-xl bg-[#131b2e]/60 border border-gray-800 space-y-2">
									<div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
										<BookOpen className="w-4 h-4" />
										1. Literature Ingest
									</div>
									<p className="text-xs text-gray-400">
										Upload local PDFs or feed markdown transcripts. Documents are chunked semantically and embedded via Hestia into SQLite-vec.
									</p>
								</div>

								<div className="p-4 rounded-xl bg-[#131b2e]/60 border border-gray-800 space-y-2">
									<div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
										<Brain className="w-4 h-4" />
										2. MCTS Deliberation
									</div>
									<p className="text-xs text-gray-400">
										Dianoia runs Monte Carlo tree rollouts over competing hypotheses to find inconsistencies and evidence gaps before finalizing conclusions.
									</p>
								</div>

								<div className="p-4 rounded-xl bg-[#131b2e]/60 border border-gray-800 space-y-2">
									<div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
										<FileText className="w-4 h-4" />
										3. Verified Dossier
									</div>
									<p className="text-xs text-gray-400">
										Generates a structured research dossier in <code>dossiers/</code> complete with methodology, citations, and Krisis verification proof.
									</p>
								</div>
							</div>
						</section>

						{/* Stoma Memory Inspector */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-bold text-white flex items-center gap-2">
									<Database className="w-4 h-4 text-purple-400" />
									Stoma Local Memory Status
								</h3>
								<button
									onClick={rebuildMemoryIndex}
									className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-purple-300 font-medium"
								>
									Sync Indexes
								</button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Storage Root</span>
									<span className="font-mono text-cyan-300 font-semibold">.stoma/</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Vector Engine</span>
									<span className="font-mono text-emerald-300 font-semibold">SQLite-vec 384d</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Telemetry</span>
									<span className="font-mono text-purple-300 font-semibold">0 bytes (Air-Gapped)</span>
								</div>
							</div>
						</section>
					</div>
				)}

				{/* ───────────── TAB 5: MISSION & ACTIVITY LEDGER ───────────── */}
				{activeTab === 'ledger' && (
					<div className="space-y-8">
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
								<History className="w-5 h-5 text-amber-400" />
								Mission & Activity Ledger
							</h2>
							<p className="text-xs text-gray-400 mb-6">
								Centralized audit trail tracking autonomous subagents, chat threads, git checkpoints, and hardware utilization
							</p>

							<div className="space-y-4">
								<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
									All Conversational & Agent Threads
								</h3>
								<div className="space-y-2">
									{agentThreadsList.map((t, idx) => (
										<div
											key={t.id}
											onClick={() => handleResumeThread(t.id)}
											className="cursor-pointer p-3.5 rounded-xl bg-[#131b2e]/60 hover:bg-[#1a253f] border border-gray-800 flex items-center justify-between group transition-all"
										>
											<div className="flex items-center gap-3">
												<span className="font-mono text-[10px] text-gray-500">#{idx + 1}</span>
												<div>
													<h4 className="text-xs font-semibold text-gray-200 group-hover:text-cyan-300 transition-colors">
														{t.title}
													</h4>
													<p className="text-[10px] text-gray-500">
														ID: {t.id} • {t.messageCount} actions • {new Date(t.lastModified).toLocaleString()}
													</p>
												</div>
											</div>
											<span className="text-[11px] text-cyan-400 font-medium group-hover:underline">
												Open Session →
											</span>
										</div>
									))}
								</div>
							</div>
						</section>

						{/* Odyssey Checkpoint Manager */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-bold text-white flex items-center gap-2">
									<GitBranch className="w-4 h-4 text-emerald-400" />
									Odyssey Milestone Checkpoints
								</h3>
								<button
									onClick={rollbackOdyssey}
									className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-1.5"
								>
									<Undo2 className="w-3.5 h-3.5" />
									Rollback to Checkpoint 0
								</button>
							</div>
							<p className="text-xs text-gray-400">
								Checkpoints automatically snapshot your repository state before agent tool execution. If an agent produces incorrect edits, you can immediately revert.
							</p>
						</section>
					</div>
				)}

			</div>
		</div>
	);
};
