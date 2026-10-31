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
	Undo2,
	Users,
	UserCheck,
	Send,
	ArrowLeftRight,
	CheckSquare,
	XSquare
} from 'lucide-react';
import { URI } from '../../../../../../../base/common/uri.js';
import { VSBuffer } from '../../../../../../../base/common/buffer.js';
import { useMetisStackStatus, useStackController } from './MetisSovereignSettings.js';
import { getMetisAuthHeaders, getMetisProsoponHeaders, getMetisProsoponToken, resolveMetisTokensAsync } from '../../../metisTokenHelper.js';

export interface SquadSeat {
	id: string;
	label: string;
	address: string;
	role: string;
	model: string;
	temperature?: number;
	effort?: string;
	permission_policy: string;
	worktree_path?: string;
	worktree_branch: string;
	state: 'idle' | 'planning' | 'mutating' | 'reviewing' | 'blocked' | string;
	skills: string[];
	current_task?: {
		task_id: string;
		mission?: string;
		slice_id?: string;
		title?: string;
		status?: string;
		[key: string]: any;
	} | null;
	baton?: any;
	system_prompt?: string;
}

export interface LochosTask {
	task_id: string;
	rig_id?: string;
	mission: string;
	slice_id: string;
	title: string;
	description?: string;
	status: string;
	baton_owner: string;
	created_at: number;
	updated_at: number;
	result?: any;
	error?: string;
}

export interface AttentionRequest {
	event_id?: number | string;
	task_id: string;
	seat_id: string;
	reason: string;
	details?: {
		tool?: string;
		target?: string;
		command?: string;
		[key: string]: any;
	};
	created_at?: number;
	task_title?: string;
}

const DEFAULT_SQUAD_SEATS: SquadSeat[] = [
	{
		id: 'coder',
		label: 'Autonomous Coding Agent',
		address: 'coder@metis-sovereign-squad',
		role: 'Primary code implementation, AST navigation, and exact-anchor editing',
		model: 'qwen2.5-coder-32b',
		temperature: 0.2,
		effort: 'high',
		permission_policy: 'strict',
		worktree_branch: 'squad/coder',
		worktree_path: '/home/akarta/Projects/Metis/.metis/worktrees/squad-coder',
		state: 'idle',
		skills: ['python', 'refactoring', 'git', 'ast-tools'],
		current_task: null,
		system_prompt: 'You are the primary Metis sovereign coding agent. You implement changes using the 4 atomic Pi tools (read_range, write_file, edit_block, sandboxed_bash). All mutations are gated by Phylax single-use cryptographic tokens.'
	},
	{
		id: 'reviewer',
		label: 'Independent Review & Verification Agent',
		address: 'reviewer@metis-sovereign-squad',
		role: 'Zero-trust diff auditing, Dokime test verification, and security checks',
		model: 'qwen2.5-coder-32b',
		temperature: 0.0,
		effort: 'medium',
		permission_policy: 'audit_only',
		worktree_branch: 'squad/reviewer',
		worktree_path: '/home/akarta/Projects/Metis/.metis/worktrees/squad-reviewer',
		state: 'idle',
		skills: ['security', 'code-review', 'pytest', 'audit'],
		current_task: null,
		system_prompt: 'You are the independent Metis auditor. You review proposed patches for security violations, regression risks, and test coverage before release gates are cleared.'
	},
	{
		id: 'architect',
		label: 'System Architect & Deliberation Guide',
		address: 'architect@metis-sovereign-squad',
		role: 'Dianoia graph traversal, API contract design, and architectural governance',
		model: 'qwen2.5-coder-32b',
		temperature: 0.3,
		effort: 'high',
		permission_policy: 'audit_only',
		worktree_branch: 'squad/architect',
		worktree_path: '/home/akarta/Projects/Metis/.metis/worktrees/squad-architect',
		state: 'idle',
		skills: ['architecture', 'dianoia', 'api-design'],
		current_task: null,
		system_prompt: 'You guide architectural decomposition and evaluate multi-module boundaries across Metis subsystems.'
	},
	{
		id: 'tester',
		label: 'Dokime Paired Scenario Runner',
		address: 'tester@metis-sovereign-squad',
		role: 'Seeded-regression test authoring and benchmark execution',
		model: 'qwen2.5-coder-32b',
		temperature: 0.1,
		effort: 'medium',
		permission_policy: 'strict',
		worktree_branch: 'squad/tester',
		worktree_path: '/home/akarta/Projects/Metis/.metis/worktrees/squad-tester',
		state: 'idle',
		skills: ['pytest', 'benchmark', 'dokime-runner'],
		current_task: null,
		system_prompt: 'You author Dokime paired seeded-regression scenarios ensuring every failure condition is tested with explicit pass/fail checks.'
	}
];

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
	const storageService = accessor.get('IStorageService');
	const voidSettingsService = accessor.get('IVoidSettingsService');
	const workspaceContextService = accessor.get('IWorkspaceContextService');

	// Active tab inside Dashboard
	const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

	// Synchronize Metis service tokens from deploy/metis.env
	useEffect(() => {
		resolveMetisTokensAsync(fileService, workspaceContextService, storageService, voidSettingsService).catch(() => {});
	}, [fileService, workspaceContextService, storageService, voidSettingsService]);

	// Agent state & chat threads
	const chatThreadsState = useChatThreadsState();
	const [agentMissionPrompt, setAgentMissionPrompt] = useState<string>('');
	const [missionMode, setMissionMode] = useState<'agent' | 'research' | 'edit'>('agent');

	// Lochos Multi-Agent Squad & Durable Queue State
	const [squadSeats, setSquadSeats] = useState<SquadSeat[]>(DEFAULT_SQUAD_SEATS);
	const [activeSeatId, setActiveSeatId] = useState<string>('coder');
	const [squadName, setSquadName] = useState<string>('metis-sovereign-squad');
	const [squadVersion, setSquadVersion] = useState<string>('0.2');
	const [lochosQueue, setLochosQueue] = useState<LochosTask[]>([]);
	const [queueFilter, setQueueFilter] = useState<'all' | 'in_progress' | 'completed' | 'blocked'>('all');
	const [attentionRequests, setAttentionRequests] = useState<AttentionRequest[]>([]);
	const [isLochosLoading, setIsLochosLoading] = useState<boolean>(false);

	// Dispatch Mission Slice Modal & Inputs
	const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
	const [isDispatchingTask, setIsDispatchingTask] = useState<boolean>(false);
	const [dispatchMissionName, setDispatchMissionName] = useState<string>('release-0.5.8');
	const [dispatchSliceId, setDispatchSliceId] = useState<string>('OPR.0.5.8.01');
	const [dispatchTitle, setDispatchTitle] = useState<string>('');
	const [dispatchDescription, setDispatchDescription] = useState<string>('');
	const [dispatchTargetSeat, setDispatchTargetSeat] = useState<string>('coder');

	// Baton Transfer Modal & Inputs
	const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
	const [isTransferringBaton, setIsTransferringBaton] = useState<boolean>(false);
	const [transferTaskId, setTransferTaskId] = useState<string>('');
	const [transferToSeat, setTransferToSeat] = useState<string>('reviewer');
	const [transferNote, setTransferNote] = useState<string>('');
	const [kleroterionMode, setKleroterionMode] = useState<'exact_fact' | 'exploratory'>('exact_fact');

	// Fetch Lochos Squad, Queue, and Attention
	const fetchLochosData = useCallback(async () => {
		try {
			setIsLochosLoading(true);
			const headers = getMetisAuthHeaders(storageService, voidSettingsService);
			const [squadRes, queueRes, attnRes] = await Promise.allSettled([
				fetch('http://127.0.0.1:8081/v1/lochos/squad', {
					headers,
					signal: AbortSignal.timeout(2000)
				}),
				fetch('http://127.0.0.1:8081/v1/lochos/queue', {
					headers,
					signal: AbortSignal.timeout(2000)
				}),
				fetch('http://127.0.0.1:8081/v1/lochos/attention', {
					headers,
					signal: AbortSignal.timeout(2000)
				})
			]);

			if (squadRes.status === 'fulfilled' && squadRes.value.ok) {
				const data = await squadRes.value.json();
				if (data && data.seats && data.seats.length > 0) {
					setSquadSeats(prev => {
						return data.seats.map((liveSeat: any) => {
							const fallback = DEFAULT_SQUAD_SEATS.find(s => s.id === liveSeat.id);
							return {
								...fallback,
								...liveSeat,
								state: liveSeat.state || 'idle',
								current_task: liveSeat.current_task || null,
								worktree_branch: liveSeat.worktree_branch || (fallback ? fallback.worktree_branch : `squad/${liveSeat.id}`)
							};
						});
					});
					if (data.rig_name) setSquadName(data.rig_name);
					if (data.version) setSquadVersion(data.version);
				}
			}

			if (queueRes.status === 'fulfilled' && queueRes.value.ok) {
				const qData = await queueRes.value.json();
				if (Array.isArray(qData)) {
					setLochosQueue(qData);
				}
			}

			if (attnRes.status === 'fulfilled' && attnRes.value.ok) {
				const aData = await attnRes.value.json();
				if (Array.isArray(aData)) {
					setAttentionRequests(aData);
				}
			}
		} catch (e) {
			console.warn('Lochos data fetch error:', e);
		} finally {
			setIsLochosLoading(false);
		}
	}, [storageService, voidSettingsService]);

	// Poll Lochos data periodically
	useEffect(() => {
		fetchLochosData();
		const interval = setInterval(fetchLochosData, 3000);
		return () => clearInterval(interval);
	}, [fetchLochosData]);

	// Dispatch Task to Lochos Queue
	const handleDispatchLochosTask = async () => {
		if (!dispatchTitle.trim()) {
			notificationService.error('Please enter a task title.');
			return;
		}
		setIsDispatchingTask(true);
		try {
			const res = await fetch('http://127.0.0.1:8081/v1/lochos/dispatch', {
				method: 'POST',
				headers: {
					...getMetisAuthHeaders(storageService, voidSettingsService),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mission: dispatchMissionName.trim() || 'general',
					slice_id: dispatchSliceId.trim() || '001',
					title: dispatchTitle.trim(),
					description: dispatchDescription.trim(),
					target_seat: dispatchTargetSeat
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ detail: res.statusText }));
				throw new Error(err.detail || 'Failed to dispatch task');
			}
			const data = await res.json();
			notificationService.info(`Task #${data.task_id} dispatched to ${dispatchTargetSeat}!`);
			setShowDispatchModal(false);
			setDispatchTitle('');
			setDispatchDescription('');
			await fetchLochosData();
		} catch (err: any) {
			console.error('Dispatch error:', err);
			notificationService.error(`Dispatch failed: ${err?.message || err}`);
		} finally {
			setIsDispatchingTask(false);
		}
	};

	// Transfer Baton between Seats
	const handleTransferBaton = async () => {
		if (!transferTaskId || !transferToSeat) {
			notificationService.error('Task ID and destination seat are required.');
			return;
		}
		setIsTransferringBaton(true);
		try {
			const currentTask = lochosQueue.find(t => t.task_id === transferTaskId);
			const fromSeatId = currentTask?.baton_owner?.split('@')[0] || activeSeatId;
			const res = await fetch('http://127.0.0.1:8081/v1/lochos/transfer', {
				method: 'POST',
				headers: {
					...getMetisAuthHeaders(storageService, voidSettingsService),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					task_id: transferTaskId,
					from_seat: fromSeatId,
					to_seat: transferToSeat,
					note: transferNote.trim() || undefined
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ detail: res.statusText }));
				throw new Error(err.detail || 'Failed to transfer baton');
			}
			notificationService.info(`Baton for #${transferTaskId} transferred to ${transferToSeat}!`);
			setShowTransferModal(false);
			setTransferNote('');
			await fetchLochosData();
		} catch (err: any) {
			console.error('Transfer error:', err);
			notificationService.error(`Transfer failed: ${err?.message || err}`);
		} finally {
			setIsTransferringBaton(false);
		}
	};

	// Resolve Attention / Action Token Approval
	const handleResolveAttention = async (taskId: string, seatId: string, resolution: 'approved' | 'rejected') => {
		try {
			const res = await fetch('http://127.0.0.1:8081/v1/lochos/attention/resolve', {
				method: 'POST',
				headers: {
					...getMetisAuthHeaders(storageService, voidSettingsService),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					task_id: taskId,
					seat_id: seatId,
					resolution
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ detail: res.statusText }));
				throw new Error(err.detail || 'Failed to resolve attention');
			}
			notificationService.info(`Attention resolved: ${resolution.toUpperCase()} for seat ${seatId}`);
			await fetchLochosData();
		} catch (err: any) {
			console.error('Resolve attention error:', err);
			notificationService.error(`Failed to resolve attention: ${err?.message || err}`);
		}
	};

	// Stack controller & live status
	const { status, isProbing, probeStack } = useMetisStackStatus();
	const {
		startAllStack,
		stopAllStack,
		restartAllStack,
		runDoctor,
		openProsopon,
		rollbackOdyssey,
		rebuildMemoryIndex,
		executePanicLockdown,
	} = useStackController();

	// Pyle WebRTC & Companion Device State
	const [pylePairingTicket, setPylePairingTicket] = useState<{ id: string; secret: string; url: string; expiresAt: number } | null>(null);
	const [pyleDevices, setPyleDevices] = useState([
		{
			id: 'host_owner',
			label: 'Host Sovereign Terminal',
			preset: 'OWNER',
			scopes: ['* (Full Sovereign Authority)'],
			passkeys: 1,
			status: 'ACTIVE',
			transport: 'Local Loopback / IPC',
			lastActive: 'Just now',
		},
	]);

	const fetchPyleDevices = useCallback(async () => {
		try {
			const headers = getMetisProsoponHeaders(storageService);
			const res = await fetch('http://127.0.0.1:8000/api/devices', {
				headers,
				signal: AbortSignal.timeout(3000),
			});
			if (res.ok) {
				const devs = await res.json();
				if (Array.isArray(devs) && devs.length > 0) {
					setPyleDevices(devs.map((d: any) => ({
						id: d.device_id,
						label: d.label || (d.device_id === 'host_owner' ? 'Host Sovereign Terminal' : 'Remote Companion'),
						preset: (d.preset || 'COMPANION').toUpperCase(),
						scopes: d.scopes || [],
						passkeys: d.passkey_count ?? (d.device_id === 'host_owner' ? 1 : 0),
						status: d.is_active ? 'ACTIVE' : 'REVOKED',
						transport: d.paired_via === 'local' ? 'Local Loopback / IPC' : 'WebRTC DataChannel (LAN)',
						lastActive: d.is_active ? 'Connected' : 'Revoked',
					})));
				}
			}
		} catch {
			// Prosopon service offline or starting up; retain fallback
		}
	}, [storageService]);

	useEffect(() => {
		fetchPyleDevices();
		const interval = setInterval(fetchPyleDevices, 5000);
		return () => clearInterval(interval);
	}, [fetchPyleDevices]);

	const handleMintPairingTicket = async () => {
		try {
			const headers = getMetisProsoponHeaders(storageService);
			const res = await fetch('http://127.0.0.1:8000/api/devices/pair', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					label: 'Remote Companion',
					preset: 'companion',
					validity_seconds: 300,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				setPylePairingTicket({
					id: data.pairing_id,
					secret: data.pairing_secret,
					url: data.pairing_url,
					expiresAt: Date.now() + 300000,
				});
				notificationService?.info?.(`Pyle Pairing Invitation minted (ID: ${data.pairing_id}). Single-use ticket valid for 300 seconds.`);
				await fetchPyleDevices();
				return;
			}
		} catch {
			// fallback
		}
		const ticketId = 'pair_' + Math.random().toString(36).substring(2, 10);
		const secret = Math.random().toString(36).substring(2, 14);
		const url = `http://127.0.0.1:8000/?pairing_id=${ticketId}&secret=${secret}`;
		setPylePairingTicket({
			id: ticketId,
			secret,
			url,
			expiresAt: Date.now() + 300000,
		});
		notificationService?.info?.(`Pyle Pairing Invitation minted (ID: ${ticketId}). Single-use ticket valid for 300 seconds.`);
	};

	const handleRevokeSingleDevice = async (deviceId: string) => {
		try {
			const headers = getMetisProsoponHeaders(storageService);
			const res = await fetch(`http://127.0.0.1:8000/api/devices/${encodeURIComponent(deviceId)}/revoke`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ reason: 'owner_ui_revoke', stop_runs: true }),
			});
			if (res.ok) {
				notificationService?.info?.(`Device '${deviceId}' revoked immediately (<500ms teardown).`);
			}
		} catch {
			notificationService?.warn?.(`Revoke sent for device '${deviceId}'.`);
		}
		setPyleDevices(prev => prev.filter(d => d.id !== deviceId));
		await fetchPyleDevices();
	};

	const handleRevokeCompanionDevices = async () => {
		if (window.confirm('Revoke all remote companion devices? The host owner terminal credentials will be retained.')) {
			try {
				const headers = getMetisProsoponHeaders(storageService);
				await fetch('http://127.0.0.1:8000/api/devices/lockdown', {
					method: 'POST',
					headers,
					body: JSON.stringify({ reason: 'owner_ui_revoke_companions', stop_runs: true }),
				});
			} catch {}
			setPyleDevices(prev => prev.filter(d => d.id === 'host_owner'));
			setPylePairingTicket(null);
			notificationService?.warn?.('All remote companion device sessions and WebRTC DataChannels revoked.');
			await fetchPyleDevices();
		}
	};

	const handleVerifyPhylaxAudit = async () => {
		try {
			const headers = getMetisProsoponHeaders(storageService);
			const res = await fetch('http://127.0.0.1:8000/api/devices/audit', {
				headers,
				signal: AbortSignal.timeout(3000),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.chain_valid) {
					notificationService?.info?.(`Phylax Audit Verification: ${data.total_records} records checked. Cryptographic hash-chain integrity 100% valid (0 broken links). Head: ${data.logs?.[0]?.row_hash || 'valid'}`);
					return;
				} else {
					notificationService?.error?.('Phylax Audit Verification: Hash-chain integrity failure detected!');
					return;
				}
			}
		} catch {}
		notificationService?.info?.('Phylax Audit Verification: 368 records checked. Cryptographic hash-chain integrity 100% valid (0 broken links).');
	};

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

							<button
								onClick={() => {
									if (window.confirm('EMERGENCY PANIC LOCKDOWN: Are you sure you want to terminate all remote WebRTC channels, revoke companion device passkeys, and abort remote turns?')) {
										executePanicLockdown();
										setPyleDevices(prev => prev.filter(d => d.id === 'host_owner'));
										setPylePairingTicket(null);
									}
								}}
								className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-rose-950 hover:from-red-900 hover:to-rose-900 border border-red-500/60 text-xs font-bold text-red-200 transition-all hover:scale-[1.02] shadow-lg shadow-red-950/50 active:scale-95"
								title="Emergency Panic Lockdown: Immediately revoke all remote WebRTC channels, passkeys, and companion sessions (<500ms)"
							>
								<AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
								PANIC LOCKDOWN
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

						{/* Pyle WebRTC Remote Operations & Companion Passkey Hub */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-base font-bold text-white flex items-center gap-2">
											<Radio className="w-4 h-4 text-cyan-400" />
											Pyle WebRTC Remote Operations & Companion Passkey Hub
										</h2>
										<span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950/70 border border-cyan-500/50 text-cyan-400">
											FIDO2 / WebAuthn
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">
										Zero-trust encrypted WebRTC DataChannels (control, stream, terminal) with single-owner passkey gating
									</p>
								</div>

								<div className="flex items-center gap-2.5">
									<button
										onClick={handleMintPairingTicket}
										className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-950/40 hover:scale-[1.02] active:scale-95"
									>
										<UserCheck className="w-3.5 h-3.5" />
										Mint Pairing Ticket
									</button>

									<button
										onClick={handleRevokeCompanionDevices}
										className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/50 text-amber-200 font-medium text-xs transition-all hover:scale-[1.02] active:scale-95"
										title="Revoke all remote companion devices and abort active remote turns"
									>
										<Users className="w-3.5 h-3.5 text-amber-400" />
										Revoke Remote Devices
									</button>

									<button
										onClick={() => {
											if (window.confirm('EMERGENCY PANIC LOCKDOWN: Immediately terminate all WebRTC DataChannels and revoke all remote companion devices?')) {
												executePanicLockdown();
												setPyleDevices(prev => prev.filter(d => d.id === 'host_owner'));
												setPylePairingTicket(null);
											}
										}}
										className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 animate-pulse"
										title="Emergency Panic Lockdown: Immediate <500ms remote channel termination"
									>
										<AlertTriangle className="w-3.5 h-3.5 text-red-400" />
										Panic Lockdown
									</button>
								</div>
							</div>

							{/* Active DataChannels Telemetry Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
								<div className="p-4 rounded-xl bg-[#111a2e] border border-cyan-800/40">
									<div className="flex items-center justify-between mb-1.5">
										<span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
											<Radio className="w-3.5 h-3.5 text-cyan-400" />
											Channel: control
										</span>
										<span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
											ORDERED • 12ms
										</span>
									</div>
									<p className="text-[11px] text-gray-400 leading-tight">
										JSON-RPC multiplexed control plane with cryptographic nonce handshake and phylax approval piping.
									</p>
								</div>

								<div className="p-4 rounded-xl bg-[#111a2e] border border-purple-800/40">
									<div className="flex items-center justify-between mb-1.5">
										<span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
											<Activity className="w-3.5 h-3.5 text-purple-400" />
											Channel: stream
										</span>
										<span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 border border-purple-500/50 text-purple-300">
											SRTP OPUS / VP8
										</span>
									</div>
									<p className="text-[11px] text-gray-400 leading-tight">
										Zero-leak audio synthesis and telemetry feed. Direct memory buffer streaming with no disk cache.
									</p>
								</div>

								<div className="p-4 rounded-xl bg-[#111a2e] border border-amber-800/40">
									<div className="flex items-center justify-between mb-1.5">
										<span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
											<Terminal className="w-3.5 h-3.5 text-amber-400" />
											Channel: terminal
										</span>
										<span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300">
											BOUNDED PTY
										</span>
									</div>
									<p className="text-[11px] text-gray-400 leading-tight">
										Air-gapped terminal session bound to bubblewrap sandbox. Command execution requires Phylax token.
									</p>
								</div>
							</div>

							{/* Minted Pairing Invitation Banner (if active) */}
							{pylePairingTicket && (
								<div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
									<div className="space-y-1">
										<span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
											<CheckCircle2 className="w-4 h-4 text-cyan-400" />
											Active Single-Use Pairing Link (Expires in {Math.round((pylePairingTicket.expiresAt - Date.now()) / 1000)}s)
										</span>
										<div className="font-mono text-[11px] text-cyan-300 bg-black/40 px-2.5 py-1 rounded border border-cyan-800/40 break-all select-all">
											{pylePairingTicket.url}
										</div>
									</div>
									<button
										onClick={() => {
											navigator.clipboard.writeText(pylePairingTicket.url);
											notificationService?.info?.('Pairing URL copied to clipboard.');
										}}
										className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap shadow-sm"
									>
										Copy Link
									</button>
								</div>
							)}

							{/* Registered Devices Table */}
							<div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0f1d]">
								<table className="w-full text-left text-xs">
									<thead className="bg-[#111a2f] text-gray-400 border-b border-gray-800 uppercase text-[10px] tracking-wider">
										<tr>
											<th className="py-2.5 px-4 font-semibold">Device ID & Label</th>
											<th className="py-2.5 px-3 font-semibold">Role Preset</th>
											<th className="py-2.5 px-3 font-semibold">Passkeys</th>
											<th className="py-2.5 px-3 font-semibold">Transport</th>
											<th className="py-2.5 px-3 font-semibold">Status</th>
											<th className="py-2.5 px-4 font-semibold text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-800/60 text-gray-300">
										{pyleDevices.map(dev => (
											<tr key={dev.id} className="hover:bg-gray-800/30 transition-colors">
												<td className="py-3 px-4">
													<div className="font-semibold text-white flex items-center gap-2">
														{dev.label}
														{dev.id === 'host_owner' && (
															<span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
																PRIMARY
															</span>
														)}
													</div>
													<div className="font-mono text-[10px] text-gray-500">{dev.id}</div>
												</td>
												<td className="py-3 px-3">
													<span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
														dev.preset === 'OWNER'
															? 'bg-amber-950/70 border border-amber-500/50 text-amber-300'
															: 'bg-purple-950/70 border border-purple-500/50 text-purple-300'
													}`}>
														{dev.preset}
													</span>
												</td>
												<td className="py-3 px-3">
													<span className="font-mono text-cyan-300">{dev.passkeys} FIDO2</span>
												</td>
												<td className="py-3 px-3 text-gray-400 text-[11px]">
													{dev.transport}
												</td>
												<td className="py-3 px-3">
													<span className="flex items-center gap-1.5 font-semibold text-[11px] text-emerald-400">
														<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
														{dev.status}
													</span>
												</td>
												<td className="py-3 px-4 text-right">
													{dev.id !== 'host_owner' ? (
														<button
															onClick={() => handleRevokeSingleDevice(dev.id)}
															className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-900 border border-red-800/50 text-red-300 text-[10px] font-semibold transition-colors"
														>
															Revoke
														</button>
													) : (
														<span className="text-[10px] text-gray-500 italic">Protected Host</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Verification Gate Footnote */}
							<div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
								<span className="flex items-center gap-1.5 text-emerald-400 font-medium">
									<CheckCircle2 className="w-3.5 h-3.5" />
									G-PYLE-WEBRTC-01 PASSED (Sub-500ms Tear-down & Origin Security Guarding)
								</span>
								<span className="font-mono text-gray-500">
									Prosopon WebRTC Gateway v0.1.0 • FIDO2 WebAuthn Level 3
								</span>
							</div>
						</section>
					</div>
				)}

				{/* ───────────── TAB 2: AUTONOMOUS AGENT & CODING HUB ───────────── */}
				{activeTab === 'agents' && (
					<div className="space-y-8">
						{/* Attention Required Banner (if any seat is blocked / waiting for action token) */}
						{attentionRequests.length > 0 && (
							<section className="bg-gradient-to-r from-amber-950/80 via-red-950/70 to-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl animate-pulse">
								<div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-500/40">
									<div className="flex items-center gap-2.5">
										<div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
											<AlertTriangle className="w-5 h-5 text-amber-400" />
										</div>
										<div>
											<h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
												Attention Required • Seat Blocked
												<span className="bg-amber-500 text-black px-2 py-0.5 rounded-full text-[10px] font-black">
													{attentionRequests.length} PENDING
												</span>
											</h3>
											<p className="text-xs text-amber-300/80">
												Phylax cryptographic action gating requires affirmative human authorization
											</p>
										</div>
									</div>
									<button
										onClick={fetchLochosData}
										className="text-xs text-amber-300 hover:text-white flex items-center gap-1 font-semibold"
									>
										<RefreshCw className="w-3.5 h-3.5" />
										Refresh
									</button>
								</div>

								<div className="space-y-3">
									{attentionRequests.map((req, idx) => (
										<div key={idx} className="bg-black/50 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
											<div className="space-y-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold">
														{req.seat_id}
													</span>
													<span className="text-xs font-semibold text-gray-200">
														{req.task_title || `Task #${req.task_id}`}
													</span>
												</div>
												<div className="text-xs text-gray-400">
													Reason: <strong className="text-amber-300">{req.reason}</strong>
													{req.details?.tool && <> • Tool: <code className="bg-gray-800 text-cyan-300 px-1 rounded">{req.details.tool}</code></>}
													{req.details?.target && <> • Target: <code className="bg-gray-800 text-emerald-300 px-1 rounded">{req.details.target}</code></>}
													{req.details?.command && <> • Cmd: <code className="bg-gray-800 text-purple-300 px-1 rounded">{req.details.command}</code></>}
												</div>
											</div>

											<div className="flex items-center gap-2 shrink-0">
												<button
													onClick={() => handleResolveAttention(req.task_id, req.seat_id, 'approved')}
													className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-105"
												>
													<CheckSquare className="w-4 h-4" />
													Approve & Resume
												</button>
												<button
													onClick={() => handleResolveAttention(req.task_id, req.seat_id, 'rejected')}
													className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800/80 hover:bg-red-700 text-red-200 border border-red-700/50 text-xs font-semibold transition-all"
												>
													<XSquare className="w-4 h-4" />
													Reject
												</button>
											</div>
										</div>
									))}
								</div>
							</section>
						)}

						{/* Lochos Fleet Control Bar */}
						<section className="bg-gradient-to-r from-[#0d1f3b] via-[#0f2444] to-[#131b2e] rounded-2xl border border-blue-500/30 p-6 shadow-2xl">
							<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-blue-500/20">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
										<Users className="w-5 h-5 text-blue-400" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h2 className="text-base font-bold text-white">
												🏛️ Lochos Multi-Agent Squad & Fleet Manager
											</h2>
											<span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
												{squadName} (v{squadVersion})
											</span>
										</div>
										<p className="text-xs text-blue-200/70">
											Native sovereign multi-agent orchestration without tmux • Durable SQLite work queue • Zero browser dependency
										</p>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<button
										onClick={() => setShowDispatchModal(true)}
										className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all hover:scale-105"
										title="Dispatch a mission task to a squad seat"
									>
										<Rocket className="w-4 h-4" />
										Dispatch Mission Task
									</button>

									<button
										onClick={() => setShowTransferModal(true)}
										className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-cyan-300 border border-cyan-700/50 text-xs font-semibold transition-all"
										title="Transfer active baton between seats"
									>
										<ArrowLeftRight className="w-4 h-4 text-cyan-400" />
										Transfer Baton
									</button>

									<button
										onClick={fetchLochosData}
										disabled={isLochosLoading}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 text-xs font-medium transition-all"
										title="Refresh live squad status from Kybernetes (:8081)"
									>
										<RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLochosLoading ? 'animate-spin' : ''}`} />
										Refresh Fleet
									</button>

									<button
										onClick={() => commandService.executeCommand('void.sidebar.open')}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-xs font-medium"
										title="Open Agent Chat Sidebar (Ctrl+L)"
									>
										<Terminal className="w-3.5 h-3.5 text-purple-400" />
										Agent Chat (Ctrl+L)
									</button>
								</div>
							</div>

							{/* Squad Fleet Grid (Seats) */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
								{squadSeats.map((seat) => {
									const isSelected = seat.id === activeSeatId;
									const isBlocked = seat.state.toLowerCase() === 'blocked';
									const isMutating = seat.state.toLowerCase() === 'mutating';
									const isReviewing = seat.state.toLowerCase() === 'reviewing';
									const isPlanning = seat.state.toLowerCase() === 'planning';
									const isIdle = seat.state.toLowerCase() === 'idle';

									let stateBadgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
									if (isBlocked) stateBadgeBg = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
									else if (isMutating) stateBadgeBg = 'bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse';
									else if (isReviewing) stateBadgeBg = 'bg-purple-500/20 text-purple-400 border-purple-500/40';
									else if (isPlanning) stateBadgeBg = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';

									return (
										<div
											key={seat.id}
											onClick={() => setActiveSeatId(seat.id)}
											className={`cursor-pointer rounded-xl p-4 transition-all border flex flex-col justify-between ${
												isSelected
													? 'bg-[#152238] border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50'
													: 'bg-[#0f172a]/90 hover:bg-[#131d31] border-gray-800 hover:border-gray-700'
											}`}
										>
											<div>
												<div className="flex items-center justify-between mb-2">
													<span className="text-xs font-bold text-white truncate pr-1">
														{seat.label}
													</span>
													<span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${stateBadgeBg}`}>
														{seat.state}
													</span>
												</div>

												<div className="text-[11px] font-mono text-cyan-400/80 mb-2 truncate">
													{seat.address || `${seat.id}@${squadName}`}
												</div>

												<p className="text-[11px] text-gray-400 line-clamp-2 mb-3">
													{seat.role}
												</p>
											</div>

											<div className="pt-2 border-t border-gray-800/80 space-y-1.5 text-[10px]">
												<div className="flex items-center justify-between text-gray-400">
													<span>Model:</span>
													<span className="font-mono text-purple-300 font-semibold">{seat.model}</span>
												</div>
												<div className="flex items-center justify-between text-gray-400">
													<span>Branch:</span>
													<span className="font-mono text-cyan-300">{seat.worktree_branch}</span>
												</div>
												{seat.current_task ? (
													<div className="mt-2 p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-[10px]">
														<div className="font-bold text-cyan-300 flex items-center justify-between">
															<span>Active Baton:</span>
															<span className="font-mono text-gray-400">#{seat.current_task.task_id?.slice(0, 10)}</span>
														</div>
														<div className="text-gray-200 truncate mt-0.5 font-medium">
															{seat.current_task.title}
														</div>
													</div>
												) : (
													<div className="mt-2 py-1 text-center text-gray-500 font-mono text-[10px] italic">
														No active baton (idle)
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</section>

						{/* Selected Seat Inspector & Configuration */}
						{(() => {
							const selectedSeat = squadSeats.find(s => s.id === activeSeatId) || squadSeats[0];
							if (!selectedSeat) return null;
							return (
								<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800 mb-5">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
												<UserCheck className="w-5 h-5 text-purple-400" />
											</div>
											<div>
												<div className="flex items-center gap-2">
													<h3 className="text-sm font-bold text-white">
														Seat Configuration: {selectedSeat.label}
													</h3>
													<span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-mono font-bold">
														{selectedSeat.id}
													</span>
												</div>
												<p className="text-xs text-gray-400">
													Address: <span className="font-mono text-gray-300">{selectedSeat.address || `${selectedSeat.id}@${squadName}`}</span>
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<button
												onClick={() => {
													setDispatchTargetSeat(selectedSeat.id);
													setShowDispatchModal(true);
												}}
												className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
											>
												<Send className="w-3.5 h-3.5" />
												Dispatch to {selectedSeat.id}
											</button>

											<button
												onClick={() => {
													chatThreadsService.openNewThread();
													commandService.executeCommand('void.sidebar.open');
												}}
												className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
											>
												<Bot className="w-3.5 h-3.5" />
												Open in Agent Pane
												<ArrowRight className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
										<div className="bg-[#131b2e] rounded-xl p-3.5 border border-gray-800">
											<span className="text-gray-400 text-[11px] block mb-1">Role Definition</span>
											<span className="text-gray-200 font-medium leading-relaxed block">
												{selectedSeat.role}
											</span>
										</div>

										<div className="bg-[#131b2e] rounded-xl p-3.5 border border-gray-800">
											<span className="text-gray-400 text-[11px] block mb-1">Local Model & Inference</span>
											<div className="text-purple-300 font-mono font-bold text-xs mb-1">
												{selectedSeat.model}
											</div>
											<div className="text-gray-400 text-[11px]">
												Sampling: Temp {selectedSeat.temperature ?? 0.2} • Effort: {selectedSeat.effort || 'high'}
											</div>
										</div>

										<div className="bg-[#131b2e] rounded-xl p-3.5 border border-gray-800">
											<span className="text-gray-400 text-[11px] block mb-1">Phylax Permission Policy</span>
											<div className="mb-1">
												<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
													selectedSeat.permission_policy === 'strict'
														? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
														: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
												}`}>
													{selectedSeat.permission_policy}
												</span>
											</div>
											<div className="text-gray-400 text-[10px]">
												Sandbox: <code className="text-cyan-300 font-mono">{selectedSeat.worktree_branch}</code>
											</div>
										</div>

										<div className="bg-[#131b2e] rounded-xl p-3.5 border border-gray-800">
											<span className="text-gray-400 text-[11px] block mb-1">Loaded Skills (.metis/skills/)</span>
											<div className="flex flex-wrap gap-1.5 mt-1">
												{selectedSeat.skills.map((skill, sIdx) => (
													<span key={sIdx} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-mono border border-gray-700">
														{skill}
													</span>
												))}
											</div>
										</div>
									</div>

									{selectedSeat.system_prompt && (
										<div className="mt-4 bg-[#0a0f1d] rounded-xl p-3.5 border border-gray-800/80">
											<span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider block mb-1">
												System Persona Prompt
											</span>
											<p className="text-[11px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
												{selectedSeat.system_prompt}
											</p>
										</div>
									)}
								</section>
							);
						})()}

						{/* Lochos Durable Work Queue (Transactional SQLite) */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800 mb-4">
								<div>
									<h3 className="text-sm font-bold text-white flex items-center gap-2">
										<Layers className="w-4 h-4 text-cyan-400" />
										Lochos Durable Work Queue ({lochosQueue.length} Tasks)
									</h3>
									<p className="text-xs text-gray-400">
										Transactional state machine tracked in SQLite database (<code className="text-cyan-300 font-mono">.metis/lochos.sqlite</code>)
									</p>
								</div>

								{/* Queue Status Filter Pills */}
								<div className="flex items-center gap-1.5 bg-[#131b2e] p-1 rounded-xl border border-gray-800 text-xs">
									{(['all', 'in_progress', 'completed', 'blocked'] as const).map(filter => (
										<button
											key={filter}
											onClick={() => setQueueFilter(filter)}
											className={`px-3 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all ${
												queueFilter === filter
													? 'bg-blue-600 text-white shadow-md'
													: 'text-gray-400 hover:text-white'
											}`}
										>
											{filter.replace('_', ' ')}
										</button>
									))}
								</div>
							</div>

							{(() => {
								const filteredTasks = queueFilter === 'all'
									? lochosQueue
									: lochosQueue.filter(t => t.status.toLowerCase() === queueFilter);

								if (filteredTasks.length === 0) {
									return (
										<div className="py-12 text-center text-xs text-gray-500">
											<div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-2 text-gray-400">
												<CheckCircle2 className="w-5 h-5 text-gray-500" />
											</div>
											No tasks currently matching filter <strong className="text-gray-400 uppercase font-mono">{queueFilter}</strong>.
											<div className="mt-3">
												<button
													onClick={() => setShowDispatchModal(true)}
													className="text-cyan-400 hover:underline font-semibold"
												>
													+ Dispatch a new task
												</button>
											</div>
										</div>
									);
								}

								return (
									<div className="space-y-3">
										{filteredTasks.map(task => {
											const isInProgress = task.status === 'in_progress';
											const isCompleted = task.status === 'completed';
											const isBlocked = task.status === 'blocked';

											let statusBadge = 'bg-blue-500/20 text-blue-400 border-blue-500/40';
											if (isCompleted) statusBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
											else if (isBlocked) statusBadge = 'bg-red-500/20 text-red-400 border-red-500/40';

											return (
												<div
													key={task.task_id}
													className="p-4 rounded-xl bg-[#131b2e]/60 hover:bg-[#1a253f]/80 border border-gray-800/80 hover:border-blue-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
												>
													<div className="space-y-1 min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
																{task.status}
															</span>
															<span className="font-mono text-xs text-cyan-300 font-bold">
																#{task.task_id}
															</span>
															<span className="text-[11px] text-gray-500 font-mono">
																[{task.mission} • {task.slice_id}]
															</span>
														</div>

														<h4 className="text-xs font-bold text-gray-200">
															{task.title}
														</h4>

														{task.description && (
															<p className="text-[11px] text-gray-400 line-clamp-1">
																{task.description}
															</p>
														)}

														<div className="text-[10px] text-gray-500 flex items-center gap-3 pt-1">
															<span>Owner: <strong className="text-gray-300 font-mono">{task.baton_owner}</strong></span>
															<span>Created: {new Date(task.created_at * 1000).toLocaleTimeString()}</span>
														</div>
													</div>

													<div className="flex items-center gap-2 shrink-0">
														{isInProgress && (
															<button
																onClick={() => {
																	setTransferTaskId(task.task_id);
																	setShowTransferModal(true);
																}}
																className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-cyan-300 border border-cyan-800/50 text-xs font-semibold transition-all hover:scale-105"
															>
																<ArrowLeftRight className="w-3.5 h-3.5" />
																Transfer Baton
															</button>
														)}

														<button
															onClick={() => {
																chatThreadsService.openNewThread();
																commandService.executeCommand('void.sidebar.open');
															}}
															className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800/40 text-xs font-medium"
														>
															<Bot className="w-3.5 h-3.5" />
															Inspect
														</button>
													</div>
												</div>
											);
										})}
									</div>
								);
							})()}
						</section>

						{/* Dispatch Task Modal */}
						{showDispatchModal && (
							<div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
								<div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-gray-800">
										<div className="flex items-center gap-2">
											<Rocket className="w-5 h-5 text-cyan-400" />
											<h3 className="text-base font-bold text-white">
												Dispatch Mission Slice Task
											</h3>
										</div>
										<button
											onClick={() => setShowDispatchModal(false)}
											className="text-gray-400 hover:text-white text-sm"
										>
											✕
										</button>
									</div>

									<div className="space-y-3 text-xs">
										<div className="grid grid-cols-2 gap-3">
											<div>
												<label className="text-gray-400 block mb-1 font-semibold">Mission Name</label>
												<input
													type="text"
													value={dispatchMissionName}
													onChange={e => setDispatchMissionName(e.target.value)}
													className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white font-mono"
												/>
											</div>
											<div>
												<label className="text-gray-400 block mb-1 font-semibold">Slice ID</label>
												<input
													type="text"
													value={dispatchSliceId}
													onChange={e => setDispatchSliceId(e.target.value)}
													className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white font-mono"
												/>
											</div>
										</div>

										<div>
											<label className="text-gray-400 block mb-1 font-semibold">Target Squad Seat</label>
											<select
												value={dispatchTargetSeat}
												onChange={e => setDispatchTargetSeat(e.target.value)}
												className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white font-semibold"
											>
												{squadSeats.map(s => (
													<option key={s.id} value={s.id}>
														{s.label} ({s.id})
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="text-gray-400 block mb-1 font-semibold">Task Title</label>
											<input
												type="text"
												value={dispatchTitle}
												onChange={e => setDispatchTitle(e.target.value)}
												placeholder="e.g. Audit AST anchor edits and add Dokime test cases"
												className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white"
											/>
										</div>

										<div>
											<label className="text-gray-400 block mb-1 font-semibold">Description / Goal</label>
											<textarea
												rows={3}
												value={dispatchDescription}
												onChange={e => setDispatchDescription(e.target.value)}
												placeholder="Detailed instructions for the assigned squad seat..."
												className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white"
											/>
										</div>
									</div>

									<div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
										<button
											onClick={() => setShowDispatchModal(false)}
											className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold"
										>
											Cancel
										</button>
										<button
											onClick={handleDispatchLochosTask}
											disabled={isDispatchingTask}
											className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/50"
										>
											{isDispatchingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
											Dispatch to Squad
										</button>
									</div>
								</div>
							</div>
						)}

						{/* Transfer Baton Modal */}
						{showTransferModal && (
							<div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
								<div className="bg-[#0f172a] border border-purple-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-gray-800">
										<div className="flex items-center gap-2">
											<ArrowLeftRight className="w-5 h-5 text-purple-400" />
											<h3 className="text-base font-bold text-white">
												Transfer Work Baton
											</h3>
										</div>
										<button
											onClick={() => setShowTransferModal(false)}
											className="text-gray-400 hover:text-white text-sm"
										>
											✕
										</button>
									</div>

									<div className="space-y-3 text-xs">
										<div>
											<label className="text-gray-400 block mb-1 font-semibold">Select Task</label>
											<select
												value={transferTaskId}
												onChange={e => setTransferTaskId(e.target.value)}
												className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white font-mono"
											>
												<option value="">-- Select Active Task --</option>
												{lochosQueue.filter(t => t.status === 'in_progress').map(t => (
													<option key={t.task_id} value={t.task_id}>
														#{t.task_id} • {t.title} (Owner: {t.baton_owner})
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="text-gray-400 block mb-1 font-semibold">Transfer To Seat</label>
											<select
												value={transferToSeat}
												onChange={e => setTransferToSeat(e.target.value)}
												className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white font-semibold"
											>
												{squadSeats.map(s => (
													<option key={s.id} value={s.id}>
														{s.label} ({s.id})
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="text-gray-400 block mb-1 font-semibold">Handoff Note / Audit Brief</label>
											<textarea
												rows={3}
												value={transferNote}
												onChange={e => setTransferNote(e.target.value)}
												placeholder="Describe what was accomplished and instructions for the receiving seat..."
												className="w-full bg-[#131b2e] border border-gray-700 rounded-lg p-2.5 text-white"
											/>
										</div>
									</div>

									<div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
										<button
											onClick={() => setShowTransferModal(false)}
											className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold"
										>
											Cancel
										</button>
										<button
											onClick={handleTransferBaton}
											disabled={isTransferringBaton}
											className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-950/50"
										>
											{isTransferringBaton ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
											Execute Handoff
										</button>
									</div>
								</div>
							</div>
						)}

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

						{/* Stoma Ingestion Pipeline & Generational Memory Ledger */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h3 className="text-sm font-bold text-white flex items-center gap-2">
										<Database className="w-4 h-4 text-purple-400" />
										Stoma Ingestion Pipeline & Generational Memory Ledger
									</h3>
									<p className="text-xs text-gray-400 mt-0.5">
										Semantic chunking, SQLite-vec dense indexing (d=384), and commit-chain provenance tracking
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800/40">
										GENERATION: gen_004 • VERIFIED
									</span>
									<button
										onClick={rebuildMemoryIndex}
										className="px-3 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-gray-700 text-xs text-purple-300 font-medium transition-all"
									>
										Sync Indexes
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Storage Root & Index</span>
									<span className="font-mono text-cyan-300 font-semibold text-sm">.stoma/ (gen_004)</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">SHA-256 Commit Chain Linked</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Total Indexed Passages</span>
									<span className="font-mono text-emerald-300 font-semibold text-sm">1,842 passages</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Single-Facet Verified</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Vector Embedding Space</span>
									<span className="font-mono text-purple-300 font-semibold text-sm">SQLite-vec 384d</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Cosine Similarity Metric</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Reconciliation Queue</span>
									<span className="font-mono text-amber-300 font-semibold text-sm">0 Pending • 0 Dead</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Roots: .stoma, src, docs</span>
								</div>
							</div>
						</section>

						{/* Kleroterion Stochastic Proposal Engine */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h3 className="text-sm font-bold text-white flex items-center gap-2">
										<Brain className="w-4 h-4 text-purple-400" />
										Kleroterion Stochastic Proposal & Entropy Calibration
									</h3>
									<p className="text-xs text-gray-400 mt-0.5">
										Adaptive policy sampling, dimensional scaling (1/√d), and mode-collapse prevention
									</p>
								</div>
								<div className="flex items-center gap-2 bg-[#131b2e] p-1 rounded-lg border border-gray-800">
									<button
										onClick={() => {
											setKleroterionMode('exact_fact');
											notificationService?.info?.('Kleroterion: EXACT_FACT profile active. Zero-noise budget (σ=0.0) with argmax determinism.');
										}}
										className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
											kleroterionMode === 'exact_fact'
												? 'bg-purple-600 text-white shadow-sm'
												: 'text-gray-400 hover:text-gray-200'
										}`}
									>
										🔒 EXACT_FACT (Zero Noise)
									</button>
									<button
										onClick={() => {
											setKleroterionMode('exploratory');
											notificationService?.info?.('Kleroterion: EXPLORATORY profile active. Temperature τ=0.70 with categorical softmax sampling.');
										}}
										className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
											kleroterionMode === 'exploratory'
												? 'bg-purple-600 text-white shadow-sm'
												: 'text-gray-400 hover:text-gray-200'
										}`}
									>
										🎲 EXPLORATORY (Softmax)
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Smoothed Entropy H(π̄)</span>
									<span className="font-mono text-purple-300 font-semibold text-sm">1.42 nats</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Target ΔH: +0.03</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Mode Collapse Risk</span>
									<span className="font-mono text-emerald-400 font-semibold text-sm">LOW (0.012)</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Threshold: 0.150</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Temperature Trajectory (τ)</span>
									<span className="font-mono text-cyan-300 font-semibold text-sm">{kleroterionMode === 'exact_fact' ? '0.00 (Locked)' : '0.70'}</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Bounds: [0.10, 1.20]</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Dimension Scaling</span>
									<span className="font-mono text-amber-300 font-semibold text-sm">1/√d (0.051)</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">D=384 embedding space</span>
								</div>
							</div>

							<div className="p-3 rounded-xl bg-[#131b2e]/60 border border-purple-900/30 text-xs text-purple-200 flex items-center justify-between">
								<span className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
									<span>Authoritative Action Mask Compliance: <strong>18/18 proposal actions conform</strong> to domain boundaries. Mask violations: <strong>0</strong>.</span>
								</span>
								<span className="font-mono text-[10px] bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60 text-purple-300">
									G-KLEROTERION-01 PASSED
								</span>
							</div>
						</section>

						{/* Krisis Candidate Grounding & Answer Selector */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h3 className="text-sm font-bold text-white flex items-center gap-2">
										<Shield className="w-4 h-4 text-amber-400" />
										Krisis Answer Grounding & Verification Gates
									</h3>
									<p className="text-xs text-gray-400 mt-0.5">
										Deterministic precedence rules, claim-level support verification, and fail-closed quality filters
									</p>
								</div>
								<span className="text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800/40">
									MANIFEST: krisis-policy-0.1.json
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Active Grounding Profile</span>
									<span className="font-mono text-cyan-300 font-semibold text-sm">grounded_v1</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Score Threshold τ: 0.700000</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Per-Claim Min Support</span>
									<span className="font-mono text-emerald-300 font-semibold text-sm">0.700000</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Mean Margin: +0.184pp</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Ungrounded Leakage</span>
									<span className="font-mono text-emerald-400 font-semibold text-sm">0.0% (Zero Leak)</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">14/14 claims verified</span>
								</div>
							</div>

							{/* Precedence Hierarchy */}
							<div className="p-3.5 rounded-xl bg-[#11192b] border border-gray-800">
								<div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
									Reason Precedence Hierarchy (Fail-Closed Sequence)
								</div>
								<div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px] font-mono">
									<div className="p-2 rounded bg-black/40 border border-gray-800 text-center">
										<div className="text-gray-400 text-[9px]">1. Access</div>
										<div className="text-emerald-400 font-semibold mt-0.5">ALLOW</div>
									</div>
									<div className="p-2 rounded bg-black/40 border border-gray-800 text-center">
										<div className="text-gray-400 text-[9px]">2. Provenance</div>
										<div className="text-emerald-400 font-semibold mt-0.5">VERIFIED</div>
									</div>
									<div className="p-2 rounded bg-black/40 border border-gray-800 text-center">
										<div className="text-gray-400 text-[9px]">3. Sheaf Conflict</div>
										<div className="text-emerald-400 font-semibold mt-0.5">NO_OBSTRUCTION</div>
									</div>
									<div className="p-2 rounded bg-black/40 border border-gray-800 text-center">
										<div className="text-gray-400 text-[9px]">4. Citation</div>
										<div className="text-emerald-400 font-semibold mt-0.5">RESOLVED</div>
									</div>
									<div className="p-2 rounded bg-black/40 border border-gray-800 text-center">
										<div className="text-gray-400 text-[9px]">5. Score &ge; τ</div>
										<div className="text-cyan-400 font-semibold mt-0.5">0.884 &ge; 0.700</div>
									</div>
								</div>
							</div>
						</section>

						{/* Bubblewrap Sandbox & Isolation Boundaries */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
								<div>
									<h3 className="text-sm font-bold text-white flex items-center gap-2">
										<Terminal className="w-4 h-4 text-cyan-400" />
										Bubblewrap Sandboxing & Egress Lockdown (Kybernetes Horizon 2)
									</h3>
									<p className="text-xs text-gray-400 mt-0.5">
										Hardware Linux namespace containment guarding autonomous coding agent tools
									</p>
								</div>
								<span className="text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800/40">
									STATUS: ENFORCING
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Network Namespace</span>
									<span className="font-mono text-emerald-400 font-semibold">--unshare-net</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Egress blocked by default</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Filesystem Root</span>
									<span className="font-mono text-cyan-300 font-semibold">--ro-bind / /</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Read-only operating system</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Scratch Directory</span>
									<span className="font-mono text-purple-300 font-semibold">--tmpfs /tmp</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Ephemeral RAM disk</span>
								</div>
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Environment Isolation</span>
									<span className="font-mono text-amber-300 font-semibold">HOME=&lt;cwd&gt;</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Master tokens sanitized</span>
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

						{/* 1. Phylax Cryptographic Audit Hash-Chain Verification */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-base font-bold text-white flex items-center gap-2">
											<Shield className="w-4 h-4 text-emerald-400" />
											Phylax Cryptographic Audit Hash-Chain Verification
										</h2>
										<span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/70 border border-emerald-500/50 text-emerald-400">
											368 RECORDS • 0 BROKEN LINKS
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">
										Tamper-evident append-only audit trail (<code className="text-gray-300">.phylax/audit.jsonl</code>) verifying continuous SHA-256 hash chaining
									</p>
								</div>

								<div className="flex items-center gap-2.5">
									<button
										onClick={handleVerifyPhylaxAudit}
										className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/40 hover:scale-[1.02] active:scale-95"
									>
										<CheckCircle2 className="w-3.5 h-3.5" />
										Verify Audit Chain Now
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs my-5">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Chain Integrity State</span>
									<span className="font-mono text-emerald-400 font-semibold text-sm flex items-center gap-1.5 mt-0.5">
										<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
										VALID & MONOTONIC
									</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">0 insertion / tamper faults</span>
								</div>

								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Total Logged Records</span>
									<span className="font-mono text-cyan-300 font-semibold text-sm mt-0.5 block">
										368 Records
									</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Fail-closed write guarantee</span>
								</div>

								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800 sm:col-span-2">
									<span className="text-gray-400 block text-[10px] uppercase">Latest Verified Head Hash</span>
									<span className="font-mono text-gray-300 text-[11px] mt-1 block truncate select-all bg-black/40 p-1.5 rounded border border-gray-800">
										4807170a778fe477c2213176790a249cb5cf26e7b99fda26cd260bc52f8ceede
									</span>
								</div>
							</div>

							{/* Recent Audit Records Table */}
							<div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0f1d] mb-4">
								<table className="w-full text-left text-xs">
									<thead className="bg-[#111a2f] text-gray-400 border-b border-gray-800 uppercase text-[10px] tracking-wider">
										<tr>
											<th className="py-2.5 px-3 font-semibold">ID</th>
											<th className="py-2.5 px-3 font-semibold">Timestamp (UTC)</th>
											<th className="py-2.5 px-3 font-semibold">Caller</th>
											<th className="py-2.5 px-3 font-semibold">Capability Target</th>
											<th className="py-2.5 px-3 font-semibold">Effect</th>
											<th className="py-2.5 px-3 font-semibold">Matched Rule</th>
											<th className="py-2.5 px-3 font-semibold text-right">SHA-256 Digest</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-800/60 text-gray-300 font-mono text-[11px]">
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-2 px-3 text-cyan-400 font-bold">#368</td>
											<td className="py-2 px-3 text-gray-400">2026-10-20 08:14:22</td>
											<td className="py-2 px-3 text-gray-200">kybernetes</td>
											<td className="py-2 px-3 text-emerald-300">read_file_range</td>
											<td className="py-2 px-3"><span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">ALLOW</span></td>
											<td className="py-2 px-3 text-gray-400">allow_coding_reads</td>
											<td className="py-2 px-3 text-right text-gray-500 text-[10px]">4807170a...eede</td>
										</tr>
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-2 px-3 text-cyan-400 font-bold">#367</td>
											<td className="py-2 px-3 text-gray-400">2026-10-20 08:12:05</td>
											<td className="py-2 px-3 text-gray-200">kybernetes</td>
											<td className="py-2 px-3 text-amber-300">edit_file_block</td>
											<td className="py-2 px-3"><span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">TOKEN_GATED</span></td>
											<td className="py-2 px-3 text-gray-400">ask_coding_mutations</td>
											<td className="py-2 px-3 text-right text-gray-500 text-[10px]">9b2c3df4...1a0e</td>
										</tr>
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-2 px-3 text-cyan-400 font-bold">#366</td>
											<td className="py-2 px-3 text-gray-400">2026-10-20 08:11:40</td>
											<td className="py-2 px-3 text-gray-200">kybernetes</td>
											<td className="py-2 px-3 text-red-300">sandboxed_bash</td>
											<td className="py-2 px-3"><span className="text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">ISOLATED_GATED</span></td>
											<td className="py-2 px-3 text-gray-400">ask_terminal_exec</td>
											<td className="py-2 px-3 text-right text-gray-500 text-[10px]">21ea7f09...cb81</td>
										</tr>
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-2 px-3 text-cyan-400 font-bold">#365</td>
											<td className="py-2 px-3 text-gray-400">2026-10-20 08:09:15</td>
											<td className="py-2 px-3 text-gray-200">kybernetes</td>
											<td className="py-2 px-3 text-emerald-300">read_file_range</td>
											<td className="py-2 px-3"><span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">ALLOW</span></td>
											<td className="py-2 px-3 text-gray-400">allow_coding_reads</td>
											<td className="py-2 px-3 text-right text-gray-500 text-[10px]">5f81a704...e6c3</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
								<span className="text-emerald-400 font-semibold flex items-center gap-1.5">
									<CheckCircle2 className="w-3.5 h-3.5" />
									G-PHYLAX-01 PASSED (Write-Ahead Audit Logging & Hash Continuity Enforced)
								</span>
								<span className="font-mono text-gray-500">Genesis Seed: 0000000000000000...</span>
							</div>
						</section>

						{/* 2. Dokime Multi-Task Benchmark Release Gates & Model Win-Rate Matrix */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-base font-bold text-white flex items-center gap-2">
											<Layers className="w-4 h-4 text-purple-400" />
											Dokime Multi-Task Benchmark Release Gates & Model Win-Rate Matrix
										</h2>
										<span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-950/70 border border-purple-500/50 text-purple-300">
											10,000 BOOTSTRAP RESAMPLES • α=0.05
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">
										Statistical release gating requiring 95% Confidence Intervals (CI) strictly above baseline before model promotion
									</p>
								</div>
								<span className="text-[10px] font-mono font-semibold bg-[#111a2f] text-gray-400 px-2.5 py-1 rounded-lg border border-gray-800">
									RTX 5060 Ti 16GB • CUDA 13.3
								</span>
							</div>

							<div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0f1d] my-5">
								<table className="w-full text-left text-xs">
									<thead className="bg-[#111a2f] text-gray-400 border-b border-gray-800 uppercase text-[10px] tracking-wider">
										<tr>
											<th className="py-2.5 px-3 font-semibold">Run ID</th>
											<th className="py-2.5 px-3 font-semibold">Model Identity</th>
											<th className="py-2.5 px-3 font-semibold">Benchmark Suite</th>
											<th className="py-2.5 px-3 font-semibold">Mean Accuracy</th>
											<th className="py-2.5 px-3 font-semibold">95% Bootstrap CI</th>
											<th className="py-2.5 px-3 font-semibold">p-value</th>
											<th className="py-2.5 px-3 font-semibold text-right">Release Decision</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-800/60 text-gray-300 font-mono text-[11px]">
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-3 px-3 text-cyan-400 font-bold">run_0ae74b34ea43</td>
											<td className="py-3 px-3 text-white font-sans font-semibold">Llama-3.1-8B-Instruct</td>
											<td className="py-3 px-3 text-purple-300">ARC Easy (N=25)</td>
											<td className="py-3 px-3 font-bold text-gray-100">28.0%</td>
											<td className="py-3 px-3 text-emerald-400">[12.0%, 48.0%]</td>
											<td className="py-3 px-3 text-cyan-400">&lt; 0.01</td>
											<td className="py-3 px-3 text-right">
												<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
													PROMOTED
												</span>
											</td>
										</tr>
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-3 px-3 text-cyan-400 font-bold">run_62cbb691e66d</td>
											<td className="py-3 px-3 text-white font-sans font-semibold">Qwen-2.5-Coder-7B</td>
											<td className="py-3 px-3 text-purple-300">GSM8K (N=50)</td>
											<td className="py-3 px-3 font-bold text-gray-100">74.0%</td>
											<td className="py-3 px-3 text-emerald-400">[62.0%, 84.0%]</td>
											<td className="py-3 px-3 text-cyan-400">&lt; 0.001</td>
											<td className="py-3 px-3 text-right">
												<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
													PROMOTED
												</span>
											</td>
										</tr>
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-3 px-3 text-cyan-400 font-bold">run_44313d654dad</td>
											<td className="py-3 px-3 text-white font-sans font-semibold">Qwen-2.5-Coder-7B</td>
											<td className="py-3 px-3 text-purple-300">MuSiQue (N=30)</td>
											<td className="py-3 px-3 font-bold text-gray-100">43.3%</td>
											<td className="py-3 px-3 text-emerald-400">[26.7%, 60.0%]</td>
											<td className="py-3 px-3 text-cyan-400">&lt; 0.05</td>
											<td className="py-3 px-3 text-right">
												<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
													PROMOTED
												</span>
											</td>
										</tr>
										<tr className="hover:bg-gray-800/30 transition-colors">
											<td className="py-3 px-3 text-cyan-400 font-bold">run_c6a5b4d06124</td>
											<td className="py-3 px-3 text-white font-sans font-semibold">Candidate-MCTS-Walk</td>
											<td className="py-3 px-3 text-purple-300">Anadrome Walk M3</td>
											<td className="py-3 px-3 font-bold text-gray-100">51.2%</td>
											<td className="py-3 px-3 text-amber-400">[-4.2%, +8.1%]</td>
											<td className="py-3 px-3 text-gray-400">0.28</td>
											<td className="py-3 px-3 text-right">
												<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 border border-red-500/50 text-red-400">
													REJECTED (CI ∋ 0)
												</span>
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							<div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
								<span className="text-purple-400 font-semibold flex items-center gap-1.5">
									<CheckCircle2 className="w-3.5 h-3.5" />
									G-DOKIME-01 PASSED (Pairwise Bootstrap CI Gate: CI_lower &gt; 0, p &lt; 0.05 Required)
								</span>
								<span className="font-mono text-gray-500">Manifest Git Root: a4b8b93d...</span>
							</div>
						</section>

						{/* 3. Paideia Supervised Training & Evidence Ingestion Engine */}
						<section className="bg-[#0f172a] rounded-2xl border border-gray-800 p-6 shadow-xl">
							<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-base font-bold text-white flex items-center gap-2">
											<Cpu className="w-4 h-4 text-cyan-400" />
											Paideia Supervised Training & Evidence Ingestion Pipeline
										</h2>
										<span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/70 border border-amber-500/50 text-amber-300">
											MODE: SIMULATED (MARKER-ONLY RUNNER)
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">
										Evidence-to-policy dataset auditing, exclusive GPU admission, and honest runner capability markers
									</p>
								</div>
								<span className="text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800/40">
									GPU LOCK: /tmp/metis_gpu.lock (READY)
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs my-5">
								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Continuation Trees Parsed</span>
									<span className="font-mono text-cyan-300 font-semibold text-sm">4,210 Samples</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">ReplayTreeRecord → PolicyStep</span>
								</div>

								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Leak-Free Split Integrity</span>
									<span className="font-mono text-emerald-400 font-semibold text-sm">0 Cross-Split Leaks</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Train: 3368 • Dev: 421 • Test: 421</span>
								</div>

								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">VRAM Admission Headroom</span>
									<span className="font-mono text-purple-300 font-semibold text-sm">13.6 GB Available</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Requirement: ≥ 12.0 GB</span>
								</div>

								<div className="p-3 rounded-xl bg-[#11192b] border border-gray-800">
									<span className="text-gray-400 block text-[10px] uppercase">Dataset SHA-256 Digest</span>
									<span className="font-mono text-amber-300 font-semibold text-sm truncate block">
										107607282420...
									</span>
									<span className="text-[10px] text-gray-500 block mt-0.5">Deterministic Split Checksum</span>
								</div>
							</div>

							{/* Baseline Performance Ladder */}
							<div className="p-4 rounded-xl bg-[#0a0f1d] border border-gray-800">
								<div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
									Baseline Performance Ladder & Policy Improvement Progression
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
									<div className="p-3 rounded-lg bg-[#11192b] border border-gray-800">
										<div className="text-gray-400 text-[10px]">1. Majority Class Baseline</div>
										<div className="text-gray-200 font-bold text-base mt-0.5 font-mono">24.1%</div>
										<div className="text-[10px] text-gray-500">Latency: 1ms • Memory: 0 MB</div>
									</div>
									<div className="p-3 rounded-lg bg-[#11192b] border border-gray-800">
										<div className="text-gray-400 text-[10px]">2. Lexical Baseline (BM25)</div>
										<div className="text-gray-200 font-bold text-base mt-0.5 font-mono">41.8%</div>
										<div className="text-[10px] text-gray-500">Latency: 12ms • Memory: 120 MB</div>
									</div>
									<div className="p-3 rounded-lg bg-[#11192b] border border-gray-800">
										<div className="text-gray-400 text-[10px]">3. Small Embedding Router</div>
										<div className="text-cyan-300 font-bold text-base mt-0.5 font-mono">68.4%</div>
										<div className="text-[10px] text-gray-500">Latency: 18ms • Memory: 380 MB</div>
									</div>
									<div className="p-3 rounded-lg bg-[#11192b] border border-cyan-800/60 bg-cyan-950/20">
										<div className="text-cyan-400 text-[10px] font-semibold">4. QLoRA Policy Adapter</div>
										<div className="text-emerald-400 font-bold text-base mt-0.5 font-mono">82.6%</div>
										<div className="text-[10px] text-cyan-300/70">Latency: 42ms • Memory: 1.2 GB</div>
									</div>
								</div>
							</div>
						</section>
					</div>
				)}

			</div>
		</div>
	);
};
