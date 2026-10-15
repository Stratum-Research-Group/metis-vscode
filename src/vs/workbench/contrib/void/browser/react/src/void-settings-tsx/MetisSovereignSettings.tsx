/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessor, useSettingsState } from '../util/services.js';
import { VoidSwitch } from '../util/inputs.js';
import { StorageScope, StorageTarget } from '../../../../../../../platform/storage/common/storage.js';
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
	Network,
	ExternalLink,
	Sliders,
	CheckCircle2,
	AlertTriangle,
	Flame,
	GitBranch,
	Key,
	Volume2,
	HardDrive,
	RefreshCw,
	Loader2,
	Check,
	X
} from 'lucide-react';

export interface ServiceStatus {
	online: boolean;
	latency: number | null;
	error?: string;
	data?: any;
}

export interface MetisStackStatus {
	hestia: ServiceStatus;
	kybernetes: ServiceStatus;
	prosopon: ServiceStatus;
}

export const useMetisStackStatus = () => {
	const [status, setStatus] = useState<MetisStackStatus>({
		hestia: { online: false, latency: null },
		kybernetes: { online: false, latency: null },
		prosopon: { online: false, latency: null },
	});
	const [isProbing, setIsProbing] = useState(false);

	const probeStack = useCallback(async () => {
		setIsProbing(true);

		// Probe Hestia (:8080)
		let hestiaRes: ServiceStatus = { online: false, latency: null };
		try {
			const t0 = performance.now();
			const res = await fetch('http://127.0.0.1:8080/v1/models', { signal: AbortSignal.timeout(1800) });
			if (res.ok) {
				const data = await res.json();
				hestiaRes = { online: true, latency: Math.round(performance.now() - t0), data: data.data || [] };
			} else {
				hestiaRes = { online: false, latency: null, error: `HTTP ${res.status}` };
			}
		} catch (e: any) {
			hestiaRes = { online: false, latency: null, error: e.message || 'Offline' };
		}

		// Probe Kybernetes (:8081)
		let kybRes: ServiceStatus = { online: false, latency: null };
		try {
			const t0 = performance.now();
			const res = await fetch('http://127.0.0.1:8081/v1/health', { signal: AbortSignal.timeout(1800) });
			if (res.ok) {
				const data = await res.json();
				kybRes = { online: true, latency: Math.round(performance.now() - t0), data };
			} else {
				kybRes = { online: false, latency: null, error: `HTTP ${res.status}` };
			}
		} catch (e: any) {
			kybRes = { online: false, latency: null, error: e.message || 'Offline' };
		}

		// Probe Prosopon (:8000)
		let prosRes: ServiceStatus = { online: false, latency: null };
		try {
			const t0 = performance.now();
			const res = await fetch('http://127.0.0.1:8000', { signal: AbortSignal.timeout(1800) });
			prosRes = { online: res.ok, latency: Math.round(performance.now() - t0) };
		} catch (e: any) {
			prosRes = { online: false, latency: null, error: e.message || 'Offline' };
		}

		setStatus({
			hestia: hestiaRes,
			kybernetes: kybRes,
			prosopon: prosRes,
		});
		setIsProbing(false);
	}, []);

	useEffect(() => {
		probeStack();
		const interval = setInterval(probeStack, 3500);
		return () => clearInterval(interval);
	}, [probeStack]);

	return { status, isProbing, probeStack };
};

export const useStackController = () => {
	const accessor = useAccessor();
	const terminalService = accessor.get('ITerminalService');
	const nativeHostService = accessor.get('INativeHostService');
	const notificationService = accessor.get('INotificationService');

	const executeCommandInStackTerminal = async (cmd: string, notifyMsg?: string) => {
		try {
			let term = terminalService.instances.find(t => t.title.includes('Metis Sovereign Stack') || t.title.includes('Metis Stack'));
			if (!term) {
				term = await terminalService.createTerminal({
					config: { name: 'Metis Sovereign Stack' },
					cwd: '/home/akarta/Projects/Metis',
				});
			}
			terminalService.setActiveInstance(term);
			await terminalService.showPanel(true);
			term.sendText(cmd, true);
			if (notifyMsg) {
				notificationService.info(notifyMsg);
			}
		} catch (err: any) {
			notificationService.error(`Failed to execute command: ${err?.message || err}`);
		}
	};

	const startAllStack = () => {
		executeCommandInStackTerminal('cd /home/akarta/Projects/Metis && ./scripts/run_stack.sh', 'Starting Metis Sovereign Stack (:8080, :8081, :8000)...');
	};

	const stopAllStack = () => {
		executeCommandInStackTerminal(
			'pkill -f "hestia.yaml" ; pkill -f "kybernetes.*serve" ; pkill -f "prosopon.*serve" ; pkill -f "run_stack.sh" ; echo "[Metis] All services stopped."',
			'Stopping all Metis Sovereign Stack processes...'
		);
	};

	const restartAllStack = () => {
		executeCommandInStackTerminal(
			'pkill -f "hestia.yaml" ; pkill -f "kybernetes.*serve" ; pkill -f "prosopon.*serve" ; pkill -f "run_stack.sh" ; sleep 1 ; cd /home/akarta/Projects/Metis && ./scripts/run_stack.sh',
			'Restarting Metis Sovereign Stack...'
		);
	};

	const startHestia = () => {
		executeCommandInStackTerminal(
			'cd /home/akarta/Projects/Metis && (hestia/.venv/bin/hestia serve --port 8080 --config hestia/hestia.yaml --models hestia/models.yaml || uv run hestia serve --port 8080 --config hestia/hestia.yaml --models hestia/models.yaml &) && echo "[Metis] Hestia starting on :8080..."',
			'Starting Hestia Model Server on port 8080...'
		);
	};

	const stopHestia = () => {
		executeCommandInStackTerminal('pkill -f "hestia.yaml" || true ; echo "[Metis] Hestia stopped."', 'Stopping Hestia Model Server...');
	};

	const restartHestia = () => {
		executeCommandInStackTerminal(
			'pkill -f "hestia.yaml" || true ; sleep 1 ; cd /home/akarta/Projects/Metis && (hestia/.venv/bin/hestia serve --port 8080 --config hestia/hestia.yaml --models hestia/models.yaml || uv run hestia serve --port 8080 --config hestia/hestia.yaml --models hestia/models.yaml &) && echo "[Metis] Hestia restarted."',
			'Restarting Hestia Model Server...'
		);
	};

	const startKybernetes = () => {
		executeCommandInStackTerminal(
			'cd /home/akarta/Projects/Metis && (kybernetes/.venv/bin/kybernetes serve --host 127.0.0.1 --port 8081 --memory-root .stoma || uv run kybernetes serve --host 127.0.0.1 --port 8081 --memory-root .stoma &) && echo "[Metis] Kybernetes starting on :8081..."',
			'Starting Kybernetes Orchestrator on port 8081...'
		);
	};

	const stopKybernetes = () => {
		executeCommandInStackTerminal('pkill -f "kybernetes.*serve" || true ; echo "[Metis] Kybernetes stopped."', 'Stopping Kybernetes Orchestrator...');
	};

	const restartKybernetes = () => {
		executeCommandInStackTerminal(
			'pkill -f "kybernetes.*serve" || true ; sleep 1 ; cd /home/akarta/Projects/Metis && (kybernetes/.venv/bin/kybernetes serve --host 127.0.0.1 --port 8081 --memory-root .stoma || uv run kybernetes serve --host 127.0.0.1 --port 8081 --memory-root .stoma &) && echo "[Metis] Kybernetes restarted."',
			'Restarting Kybernetes Orchestrator...'
		);
	};

	const startProsopon = () => {
		executeCommandInStackTerminal(
			'cd /home/akarta/Projects/Metis && (prosopon/.venv/bin/prosopon serve --port 8000 --kybernetes-url http://127.0.0.1:8081/v1 --no-mock || uv run prosopon serve --port 8000 --kybernetes-url http://127.0.0.1:8081/v1 --no-mock &) && echo "[Metis] Prosopon starting on :8000..."',
			'Starting Prosopon Web Interface on port 8000...'
		);
	};

	const stopProsopon = () => {
		executeCommandInStackTerminal('pkill -f "prosopon.*serve" || true ; echo "[Metis] Prosopon stopped."', 'Stopping Prosopon Web Interface...');
	};

	const restartProsopon = () => {
		executeCommandInStackTerminal(
			'pkill -f "prosopon.*serve" || true ; sleep 1 ; cd /home/akarta/Projects/Metis && (prosopon/.venv/bin/prosopon serve --port 8000 --kybernetes-url http://127.0.0.1:8081/v1 --no-mock || uv run prosopon serve --port 8000 --kybernetes-url http://127.0.0.1:8081/v1 --no-mock &) && echo "[Metis] Prosopon restarted."',
			'Restarting Prosopon Web Interface...'
		);
	};

	const runDoctor = () => {
		executeCommandInStackTerminal('cd /home/akarta/Projects/Metis && (kybernetes/.venv/bin/python -m kybernetes.cli doctor || uv run kybernetes doctor)', 'Running Metis Subsystem Inspection...');
	};

	const rollbackOdyssey = () => {
		executeCommandInStackTerminal('cd /home/akarta/Projects/Metis && git stash push -m "Pre-rollback stashed changes" && git checkout refs/odyssey/checkpoint_0 && echo "[Metis] Workspace rolled back to milestone checkpoint_0."', 'Rolling back workspace to milestone checkpoint_0...');
	};

	const rebuildMemoryIndex = () => {
		executeCommandInStackTerminal('cd /home/akarta/Projects/Metis && python3 -c "import os; print(\"Syncing .stoma hierarchical memory indexes...\")" && echo "[Metis] Stoma index synchronized."', 'Rebuilding Stoma memory index...');
	};

	const openProsopon = () => {
		try {
			nativeHostService.openExternal('http://127.0.0.1:8000');
		} catch {
			window.open('http://127.0.0.1:8000', '_blank');
		}
	};

	return {
		startAllStack,
		stopAllStack,
		restartAllStack,
		startHestia,
		stopHestia,
		restartHestia,
		startKybernetes,
		stopKybernetes,
		restartKybernetes,
		startProsopon,
		stopProsopon,
		restartProsopon,
		runDoctor,
		rollbackOdyssey,
		rebuildMemoryIndex,
		openProsopon,
	};
};

const StatusBadge = ({ online, latency }: { online: boolean; latency: number | null }) => {
	if (online) {
		return (
			<span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono">
				<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
				ONLINE {latency !== null ? `(${latency}ms)` : ''}
			</span>
		);
	}
	return (
		<span className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono">
			<span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
			STOPPED
		</span>
	);
};

// =========================================================================
// 1. Primary Sovereign C&C Hub Section
// =========================================================================
export const MetisControlCenterSection = ({ onSelectTab }: { onSelectTab?: (tab: string) => void }) => {
	const { status, isProbing, probeStack } = useMetisStackStatus();
	const controller = useStackController();

	const allRunning = status.hestia.online && status.kybernetes.online && status.prosopon.online;

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Master Header Card */}
			<div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-cyan-950/40 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-md shadow-lg">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
					<div className="flex items-center gap-3">
						<span className="text-3xl">🏛️</span>
						<div>
							<h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
								Metis Sovereign Command & Control
							</h3>
							<p className="text-xs text-indigo-300">
								Unified Local AI Orchestration Hub • Arch Linux Local Engine • Zero Cloud Egress
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={probeStack}
							className="p-1.5 text-xs bg-void-bg-2 border border-void-border-2 rounded-lg text-void-fg-2 hover:text-white flex items-center gap-1.5 transition"
							title="Refresh Stack Status"
						>
							<RefreshCw className={`size-3.5 ${isProbing ? 'animate-spin' : ''}`} />
							<span>Poll</span>
						</button>
						<span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold">
							AIR-GAPPED
						</span>
					</div>
				</div>

				{/* Master Control Buttons */}
				<div className="flex flex-wrap items-center gap-3 pt-3 border-t border-indigo-500/20">
					<button
						onClick={controller.startAllStack}
						className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<Play className="size-3.5 fill-current" />
						Start Sovereign Stack
					</button>
					<button
						onClick={controller.stopAllStack}
						className="flex items-center gap-2 bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<Square className="size-3.5 fill-current" />
						Stop All Stack
					</button>
					<button
						onClick={controller.restartAllStack}
						className="flex items-center gap-2 bg-void-bg-2 hover:bg-void-bg-1 border border-void-border-2 text-void-fg-1 font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<RotateCcw className="size-3.5" />
						Restart Stack
					</button>
					<button
						onClick={controller.runDoctor}
						className="flex items-center gap-2 bg-void-bg-2 hover:bg-void-bg-1 border border-void-border-2 text-void-fg-1 font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95 ml-auto"
					>
						<Activity className="size-3.5" />
						Doctor Diagnostics
					</button>
					<button
						onClick={controller.openProsopon}
						className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<ExternalLink className="size-3.5" />
						Open Web Studio
					</button>
				</div>
			</div>

			{/* Service Status Matrix */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* 1. Hestia Card */}
				<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-500/40 transition">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-lg">🔥</span>
							<h4 className="font-semibold text-void-fg-1 text-sm">Hestia</h4>
						</div>
						<StatusBadge online={status.hestia.online} latency={status.hestia.latency} />
					</div>
					<p className="text-xs text-void-fg-3">Local model inference server on GPU/CPU with OpenAI-compatible API.</p>
					<div className="text-[11px] font-mono text-void-fg-2 bg-void-bg-1/70 px-2 py-1 rounded border border-void-border-2 flex justify-between">
						<span>Port: 8080</span>
						<span>{status.hestia.data?.length ? `${status.hestia.data.length} Models` : '0 Models'}</span>
					</div>
					<div className="flex items-center gap-1.5 pt-2 border-t border-void-border-2">
						{status.hestia.online ? (
							<button onClick={controller.stopHestia} className="flex-1 text-[11px] py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded border border-rose-500/20">
								Stop
							</button>
						) : (
							<button onClick={controller.startHestia} className="flex-1 text-[11px] py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded border border-emerald-500/20">
								Start
							</button>
						)}
						<button onClick={controller.restartHestia} className="p-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
							<RotateCcw className="size-3" />
						</button>
						{onSelectTab && (
							<button onClick={() => onSelectTab('hestia')} className="text-[11px] px-2 py-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
								Configure
							</button>
						)}
					</div>
				</div>

				{/* 2. Kybernetes Card */}
				<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-500/40 transition">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-lg">🧭</span>
							<h4 className="font-semibold text-void-fg-1 text-sm">Kybernetes</h4>
						</div>
						<StatusBadge online={status.kybernetes.online} latency={status.kybernetes.latency} />
					</div>
					<p className="text-xs text-void-fg-3">Autonomous agent orchestrator with Odyssey checkpointing and FSM loop.</p>
					<div className="text-[11px] font-mono text-void-fg-2 bg-void-bg-1/70 px-2 py-1 rounded border border-void-border-2 flex justify-between">
						<span>Port: 8081</span>
						<span>{status.kybernetes.data?.version ? `v${status.kybernetes.data.version}` : 'Idle'}</span>
					</div>
					<div className="flex items-center gap-1.5 pt-2 border-t border-void-border-2">
						{status.kybernetes.online ? (
							<button onClick={controller.stopKybernetes} className="flex-1 text-[11px] py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded border border-rose-500/20">
								Stop
							</button>
						) : (
							<button onClick={controller.startKybernetes} className="flex-1 text-[11px] py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded border border-emerald-500/20">
								Start
							</button>
						)}
						<button onClick={controller.restartKybernetes} className="p-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
							<RotateCcw className="size-3" />
						</button>
						{onSelectTab && (
							<button onClick={() => onSelectTab('kybernetes')} className="text-[11px] px-2 py-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
								Configure
							</button>
						)}
					</div>
				</div>

				{/* 3. Prosopon Card */}
				<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-500/40 transition">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-lg">🎭</span>
							<h4 className="font-semibold text-void-fg-1 text-sm">Prosopon</h4>
						</div>
						<StatusBadge online={status.prosopon.online} latency={status.prosopon.latency} />
					</div>
					<p className="text-xs text-void-fg-3">Zero-dependency web studio & PIN-authenticated mobile pairing client.</p>
					<div className="text-[11px] font-mono text-void-fg-2 bg-void-bg-1/70 px-2 py-1 rounded border border-void-border-2 flex justify-between">
						<span>Port: 8000</span>
						<span>Web / PTT Audio</span>
					</div>
					<div className="flex items-center gap-1.5 pt-2 border-t border-void-border-2">
						{status.prosopon.online ? (
							<button onClick={controller.stopProsopon} className="flex-1 text-[11px] py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded border border-rose-500/20">
								Stop
							</button>
						) : (
							<button onClick={controller.startProsopon} className="flex-1 text-[11px] py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded border border-emerald-500/20">
								Start
							</button>
						)}
						<button onClick={controller.restartProsopon} className="p-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
							<RotateCcw className="size-3" />
						</button>
						{onSelectTab && (
							<button onClick={() => onSelectTab('prosopon')} className="text-[11px] px-2 py-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
								Configure
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Subsystem Quick Links */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-3">
				<h4 className="font-semibold text-void-fg-1 text-sm flex items-center gap-2">
					<Sliders className="size-4 text-cyan-400" />
					Sovereign Subsystems & Governance
				</h4>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
					<div
						onClick={() => onSelectTab && onSelectTab('phylax')}
						className="p-3 bg-void-bg-1/80 border border-void-border-2 hover:border-amber-500/50 rounded-lg cursor-pointer transition flex flex-col gap-1"
					>
						<div className="flex items-center gap-1.5 font-semibold text-xs text-amber-400">
							<Shield className="size-3.5" />
							<span>Phylax</span>
						</div>
						<p className="text-[11px] text-void-fg-3">Cryptographic action governance & tool token gating.</p>
					</div>

					<div
						onClick={() => onSelectTab && onSelectTab('dianoia')}
						className="p-3 bg-void-bg-1/80 border border-void-border-2 hover:border-cyan-500/50 rounded-lg cursor-pointer transition flex flex-col gap-1"
					>
						<div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-400">
							<Brain className="size-3.5" />
							<span>Dianoia</span>
						</div>
						<p className="text-[11px] text-void-fg-3">Deliberative causal reasoning & Odyssey rollback.</p>
					</div>

					<div
						onClick={() => onSelectTab && onSelectTab('stoma')}
						className="p-3 bg-void-bg-1/80 border border-void-border-2 hover:border-purple-500/50 rounded-lg cursor-pointer transition flex flex-col gap-1"
					>
						<div className="flex items-center gap-1.5 font-semibold text-xs text-purple-400">
							<HardDrive className="size-3.5" />
							<span>Stoma / LTHCM</span>
						</div>
						<p className="text-[11px] text-void-fg-3">Hierarchical context memory & local vector embeddings.</p>
					</div>

					<div
						onClick={() => onSelectTab && onSelectTab('models')}
						className="p-3 bg-void-bg-1/80 border border-void-border-2 hover:border-emerald-500/50 rounded-lg cursor-pointer transition flex flex-col gap-1"
					>
						<div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400">
							<Cpu className="size-3.5" />
							<span>Editor Mapping</span>
						</div>
						<p className="text-[11px] text-void-fg-3">Bind Chat, Apply, and Autocomplete to Hestia models.</p>
					</div>
				</div>
			</div>
		</div>
	);
};

// =========================================================================
// 2. Hestia Local Inference Server Section
// =========================================================================
export const HestiaSection = () => {
	const settingsState = useSettingsState();
	const accessor = useAccessor();
	const voidSettingsService = accessor.get('IVoidSettingsService');
	const storageService = accessor.get('IStorageService');
	const { status } = useMetisStackStatus();
	const controller = useStackController();

	const metisSettings = settingsState.settingsOfProvider.metis;

	const [contextLength, setContextLength] = useState(
		storageService.get('metis.hestia.contextLength', StorageScope.APPLICATION, '8192')
	);
	const [temperature, setTemperature] = useState(
		storageService.get('metis.hestia.temperature', StorageScope.APPLICATION, '0.2')
	);
	const [topP, setTopP] = useState(
		storageService.get('metis.hestia.topP', StorageScope.APPLICATION, '0.9')
	);
	const [vramBudget, setVramBudget] = useState(
		storageService.get('metis.hestia.vramBudget', StorageScope.APPLICATION, '12GB')
	);

	const updateStorage = (key: string, val: string, setter: (v: string) => void) => {
		setter(val);
		storageService.store(key, val, StorageScope.APPLICATION, StorageTarget.USER);
	};

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Header */}
			<div className="flex items-center justify-between bg-void-bg-2 border border-void-border-2 rounded-xl p-5">
				<div>
					<h3 className="text-base font-bold text-void-fg-1 flex items-center gap-2">
						<span>🔥</span> Hestia Model Inference Engine
					</h3>
					<p className="text-xs text-void-fg-3">OpenAI-compatible inference server running directly on local GPU/CPU hardware.</p>
				</div>
				<div className="flex items-center gap-3">
					<StatusBadge online={status.hestia.online} latency={status.hestia.latency} />
					{status.hestia.online ? (
						<button onClick={controller.stopHestia} className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-lg">
							Stop
						</button>
					) : (
						<button onClick={controller.startHestia} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
							Start
						</button>
					)}
					<button onClick={controller.restartHestia} className="p-1.5 text-xs bg-void-bg-1 border border-void-border-2 text-void-fg-2 hover:text-white rounded-lg">
						<RotateCcw className="size-3.5" />
					</button>
				</div>
			</div>

			{/* Configuration Options */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Connection & Service Parameters
				</h4>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Hestia Endpoint URL</label>
					<input
						type="text"
						value={metisSettings?.endpoint || 'http://127.0.0.1:8080/v1'}
						onChange={(e) => voidSettingsService.setSettingOfProvider('metis', 'endpoint', e.target.value)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500 font-mono"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">API Key / Service Token</label>
					<input
						type="password"
						value={metisSettings?.apiKey || 'metis-sovereign'}
						onChange={(e) => voidSettingsService.setSettingOfProvider('metis', 'apiKey', e.target.value)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500 font-mono"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Context Window (tokens)</label>
						<select
							value={contextLength}
							onChange={(e) => updateStorage('metis.hestia.contextLength', e.target.value, setContextLength)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="4096">4,096 tokens</option>
							<option value="8192">8,192 tokens (Standard)</option>
							<option value="16384">16,384 tokens (High)</option>
							<option value="32768">32,768 tokens (Ultra)</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">VRAM Budget Target</label>
						<select
							value={vramBudget}
							onChange={(e) => updateStorage('metis.hestia.vramBudget', e.target.value, setVramBudget)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="8GB">8 GB (RTX 3070 / 4060)</option>
							<option value="12GB">12 GB (RTX 5060 Ti / 3060)</option>
							<option value="16GB">16 GB (RTX 4080 / 5080)</option>
							<option value="24GB">24 GB (RTX 3090 / 4090)</option>
							<option value="CPU">CPU Only (GGUF llama.cpp)</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-xs text-void-fg-2 font-medium">
							<span>Temperature</span>
							<span className="font-mono text-cyan-400">{temperature}</span>
						</div>
						<input
							type="range"
							min="0.0"
							max="1.0"
							step="0.05"
							value={temperature}
							onChange={(e) => updateStorage('metis.hestia.temperature', e.target.value, setTemperature)}
							className="w-full accent-cyan-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-xs text-void-fg-2 font-medium">
							<span>Top-P Sampling</span>
							<span className="font-mono text-cyan-400">{topP}</span>
						</div>
						<input
							type="range"
							min="0.1"
							max="1.0"
							step="0.05"
							value={topP}
							onChange={(e) => updateStorage('metis.hestia.topP', e.target.value, setTopP)}
							className="w-full accent-cyan-500"
						/>
					</div>
				</div>
			</div>

			{/* Available Models List */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-3">
				<h4 className="font-semibold text-void-fg-1 text-sm">Installed Sovereign Models in Hestia</h4>
				<div className="flex flex-col gap-2">
					{[
						{ id: 'gemma-4-26b-a4b-abliterated', desc: 'Primary Reasoning & Coding Model (Q3_K_M)', type: 'Chat/Reasoning' },
						{ id: 'qwen2.5-14b-instruct', desc: 'Fast Fill-In-The-Middle & Inline Edits (Q4_K_M)', type: 'FIM/Edit' },
						{ id: 'llama-3.1-8b-instruct', desc: 'Lightweight Sovereign Chat Model (Q4_K_M)', type: 'Chat' },
						{ id: 'nomic-embed-text', desc: 'Dense Vector Embeddings for Stoma LTHCM (Q8_0)', type: 'Embedding' },
					].map((m) => (
						<div key={m.id} className="p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg flex items-center justify-between">
							<div>
								<div className="font-mono text-xs font-semibold text-white">{m.id}</div>
								<div className="text-[11px] text-void-fg-3">{m.desc}</div>
							</div>
							<span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded">
								{m.type}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

// =========================================================================
// 3. Kybernetes Agent Orchestrator Section
// =========================================================================
export const KybernetesSection = () => {
	const settingsState = useSettingsState();
	const accessor = useAccessor();
	const voidSettingsService = accessor.get('IVoidSettingsService');
	const storageService = accessor.get('IStorageService');
	const { status } = useMetisStackStatus();
	const controller = useStackController();

	const metisSettings = settingsState.settingsOfProvider.metis;

	const [maxFsmSteps, setMaxFsmSteps] = useState(
		storageService.get('metis.kybernetes.maxFsmSteps', StorageScope.APPLICATION, '25')
	);
	const [routerStrategy, setRouterStrategy] = useState(
		storageService.get('metis.kybernetes.routerStrategy', StorageScope.APPLICATION, 'tool_calling')
	);
	const [enableWorktrees, setEnableWorktrees] = useState(
		storageService.getBoolean('metis.kybernetes.enableWorktrees', StorageScope.APPLICATION, true)
	);

	const updateStorage = (key: string, val: string, setter: (v: string) => void) => {
		setter(val);
		storageService.store(key, val, StorageScope.APPLICATION, StorageTarget.USER);
	};

	const toggleWorktrees = (val: boolean) => {
		setEnableWorktrees(val);
		storageService.store('metis.kybernetes.enableWorktrees', val, StorageScope.APPLICATION, StorageTarget.USER);
	};

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Header */}
			<div className="flex items-center justify-between bg-void-bg-2 border border-void-border-2 rounded-xl p-5">
				<div>
					<h3 className="text-base font-bold text-void-fg-1 flex items-center gap-2">
						<span>🧭</span> Kybernetes Agent Orchestrator
					</h3>
					<p className="text-xs text-void-fg-3">Autonomous agent harness managing Odyssey checkpoints, tools, and subagents.</p>
				</div>
				<div className="flex items-center gap-3">
					<StatusBadge online={status.kybernetes.online} latency={status.kybernetes.latency} />
					{status.kybernetes.online ? (
						<button onClick={controller.stopKybernetes} className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-lg">
							Stop
						</button>
					) : (
						<button onClick={controller.startKybernetes} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
							Start
						</button>
					)}
					<button onClick={controller.restartKybernetes} className="p-1.5 text-xs bg-void-bg-1 border border-void-border-2 text-void-fg-2 hover:text-white rounded-lg">
						<RotateCcw className="size-3.5" />
					</button>
				</div>
			</div>

			{/* Configuration */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Orchestration Parameters
				</h4>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Kybernetes Orchestrator Endpoint</label>
					<input
						type="text"
						value={metisSettings?.orchestratorEndpoint || 'http://127.0.0.1:8081/v1'}
						onChange={(e) => voidSettingsService.setSettingOfProvider('metis', 'orchestratorEndpoint', e.target.value)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500 font-mono"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Max Autonomous Steps (FSM Budget)</label>
						<select
							value={maxFsmSteps}
							onChange={(e) => updateStorage('metis.kybernetes.maxFsmSteps', e.target.value, setMaxFsmSteps)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="10">10 steps (Quick check)</option>
							<option value="25">25 steps (Default standard)</option>
							<option value="50">50 steps (Deep multi-file edit)</option>
							<option value="100">100 steps (Extended exploration)</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Router Strategy</label>
						<select
							value={routerStrategy}
							onChange={(e) => updateStorage('metis.kybernetes.routerStrategy', e.target.value, setRouterStrategy)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="tool_calling">Tool-Calling Loop (Standard)</option>
							<option value="direct">Direct Synthesis (Fast FIM)</option>
							<option value="odyssey_chain">Odyssey Deliberation Chain (Deep)</option>
						</select>
					</div>
				</div>

				{/* Ephemeral Worktree Toggle */}
				<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
					<div>
						<div className="font-semibold text-xs text-void-fg-1">Ephemeral Git Worktrees</div>
						<div className="text-[11px] text-void-fg-3">
							Run subagents in isolated git worktrees at <code className="font-mono text-cyan-300">.metis/worktrees/</code> to prevent dirty tree pollution.
						</div>
					</div>
					<VoidSwitch value={enableWorktrees} onChange={toggleWorktrees} />
				</div>
			</div>
		</div>
	);
};

// =========================================================================
// 4. Phylax Security & Capability Governance Section
// =========================================================================
export const PhylaxSection = () => {
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');
	const notificationService = accessor.get('INotificationService');

	const [defaultDeny, setDefaultDeny] = useState(
		storageService.getBoolean('metis.phylax.defaultDeny', StorageScope.APPLICATION, true)
	);
	const [tokenTtl, setTokenTtl] = useState(
		storageService.get('metis.phylax.tokenTtl', StorageScope.APPLICATION, '300')
	);
	const [policyPath, setPolicyPath] = useState(
		storageService.get('metis.phylax.policyPath', StorageScope.APPLICATION, 'policies/default_policy.yaml')
	);

	const toggleDefaultDeny = (val: boolean) => {
		setDefaultDeny(val);
		storageService.store('metis.phylax.defaultDeny', val, StorageScope.APPLICATION, StorageTarget.USER);
	};

	const updateTtl = (val: string) => {
		setTokenTtl(val);
		storageService.store('metis.phylax.tokenTtl', val, StorageScope.APPLICATION, StorageTarget.USER);
	};

	const flushTokens = () => {
		notificationService.info('Flushed all pending and expired Phylax action tokens.');
	};

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Header */}
			<div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl p-5">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Shield className="size-5 text-amber-400" />
						<h3 className="text-base font-bold text-white">Phylax Capability Guard</h3>
					</div>
					<span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
						FAIL-CLOSED
					</span>
				</div>
				<p className="text-xs text-amber-200/80">
					Zero-trust capability gating. Every tool execution (file edit, write, bash) requires an affirmative single-use cryptographic token.
				</p>
			</div>

			{/* Policy Options */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Security Policy Configuration
				</h4>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Policy Specification YAML File</label>
					<input
						type="text"
						value={policyPath}
						onChange={(e) => {
							setPolicyPath(e.target.value);
							storageService.store('metis.phylax.policyPath', e.target.value, StorageScope.APPLICATION, StorageTarget.USER);
						}}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-amber-500"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Default-Deny Policy</div>
							<div className="text-[11px] text-void-fg-3">Block any tool call not explicitly permitted.</div>
						</div>
						<VoidSwitch value={defaultDeny} onChange={toggleDefaultDeny} />
					</div>

					<div className="flex flex-col gap-1.5 p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<label className="text-xs text-void-fg-2 font-semibold">Action Token TTL (seconds)</label>
						<select
							value={tokenTtl}
							onChange={(e) => updateTtl(e.target.value)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-2 py-1 text-xs text-void-fg-1"
						>
							<option value="60">60 seconds</option>
							<option value="300">300 seconds (5 min standard)</option>
							<option value="900">900 seconds (15 min)</option>
						</select>
					</div>
				</div>

				{/* Matrix */}
				<div className="flex flex-col gap-2">
					<div className="text-xs font-semibold text-void-fg-2">Tool Permission Matrix</div>
					<div className="flex flex-col gap-1.5 font-mono text-xs">
						<div className="flex justify-between p-2 bg-void-bg-1 rounded border border-void-border-2">
							<span className="text-void-fg-1">read_file_range</span>
							<span className="text-emerald-400 font-semibold">AUTO_ALLOW (Read-Only)</span>
						</div>
						<div className="flex justify-between p-2 bg-void-bg-1 rounded border border-void-border-2">
							<span className="text-void-fg-1">edit_file_block</span>
							<span className="text-amber-400 font-semibold">TOKEN_GATED (Requires Prompt)</span>
						</div>
						<div className="flex justify-between p-2 bg-void-bg-1 rounded border border-void-border-2">
							<span className="text-void-fg-1">write_file</span>
							<span className="text-amber-400 font-semibold">TOKEN_GATED (Requires Prompt)</span>
						</div>
						<div className="flex justify-between p-2 bg-void-bg-1 rounded border border-void-border-2">
							<span className="text-void-fg-1">sandboxed_bash</span>
							<span className="text-rose-400 font-semibold">ISOLATED_GATED (Strict Sandbox)</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 pt-2">
					<button
						onClick={flushTokens}
						className="px-4 py-2 bg-void-bg-1 hover:bg-void-bg-2 border border-void-border-2 rounded-lg text-xs text-void-fg-1 font-medium transition"
					>
						Flush Expired Action Tokens
					</button>
				</div>
			</div>
		</div>
	);
};

// =========================================================================
// 5. Dianoia Deliberation & Checkpoint Section
// =========================================================================
export const DianoiaSection = () => {
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');
	const controller = useStackController();

	const [deliberationMode, setDeliberationMode] = useState(
		storageService.get('metis.dianoia.mode', StorageScope.APPLICATION, 'reflective')
	);
	const [autoCheckpoint, setAutoCheckpoint] = useState(
		storageService.getBoolean('metis.dianoia.autoCheckpoint', StorageScope.APPLICATION, true)
	);
	const [enableHermes, setEnableHermes] = useState(
		storageService.getBoolean('metis.dianoia.enableHermes', StorageScope.APPLICATION, true)
	);

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Header */}
			<div className="bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-xl p-5">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Brain className="size-5 text-cyan-400" />
						<h3 className="text-base font-bold text-white">Dianoia Deliberation & Odyssey Rollback</h3>
					</div>
					<span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
						REASONING ENGINE
					</span>
				</div>
				<p className="text-xs text-cyan-200/80">
					Hypothesis exploration, multi-step reflection, and atomic Odyssey git milestone checkpoints with instant verification rollback.
				</p>
			</div>

			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Deliberation & Checkpoints
				</h4>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Deliberation Strategy</label>
					<select
						value={deliberationMode}
						onChange={(e) => {
							setDeliberationMode(e.target.value);
							storageService.store('metis.dianoia.mode', e.target.value, StorageScope.APPLICATION, StorageTarget.USER);
						}}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1"
					>
						<option value="fast">Fast Path (Single draft with heuristic check)</option>
						<option value="reflective">Reflective Verifier (Krisis heuristic pass)</option>
						<option value="odyssey_tree">Full Odyssey Causal Tree (Branching exploration)</option>
					</select>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Odyssey Auto-Checkpoints</div>
							<div className="text-[11px] text-void-fg-3">Snapshot git branch prior to agent write.</div>
						</div>
						<VoidSwitch
							value={autoCheckpoint}
							onChange={(v) => {
								setAutoCheckpoint(v);
								storageService.store('metis.dianoia.autoCheckpoint', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Hermes Skill Synthesis</div>
							<div className="text-[11px] text-void-fg-3">Auto-crystallize verified skills to <code className="font-mono text-cyan-300">.metis/skills/</code>.</div>
						</div>
						<VoidSwitch
							value={enableHermes}
							onChange={(v) => {
								setEnableHermes(v);
								storageService.store('metis.dianoia.enableHermes', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>
				</div>

				<div className="pt-2 border-t border-void-border-2 flex items-center justify-between">
					<div className="text-xs text-void-fg-3">
						Latest Milestone: <code className="font-mono text-cyan-400">refs/odyssey/checkpoint_0</code>
					</div>
					<button
						onClick={controller.rollbackOdyssey}
						className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs rounded-lg transition"
					>
						Rollback Workspace to Last Milestone
					</button>
				</div>
			</div>
		</div>
	);
};

// =========================================================================
// 6. Prosopon Web Interface & Device Pairing Section
// =========================================================================
export const ProsoponSection = () => {
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');
	const { status } = useMetisStackStatus();
	const controller = useStackController();

	const [requirePin, setRequirePin] = useState(
		storageService.getBoolean('metis.prosopon.requirePin', StorageScope.APPLICATION, false)
	);
	const [audioFeedback, setAudioFeedback] = useState(
		storageService.getBoolean('metis.prosopon.audioFeedback', StorageScope.APPLICATION, true)
	);

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Header */}
			<div className="flex items-center justify-between bg-void-bg-2 border border-void-border-2 rounded-xl p-5">
				<div>
					<h3 className="text-base font-bold text-void-fg-1 flex items-center gap-2">
						<span>🎭</span> Prosopon Web Studio & Mobile Pairing
					</h3>
					<p className="text-xs text-void-fg-3">Zero-dependency web client with push-to-talk voice input and PIN pairing daemon.</p>
				</div>
				<div className="flex items-center gap-3">
					<StatusBadge online={status.prosopon.online} latency={status.prosopon.latency} />
					{status.prosopon.online ? (
						<button onClick={controller.stopProsopon} className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-lg">
							Stop
						</button>
					) : (
						<button onClick={controller.startProsopon} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
							Start
						</button>
					)}
					<button onClick={controller.restartProsopon} className="p-1.5 text-xs bg-void-bg-1 border border-void-border-2 text-void-fg-2 hover:text-white rounded-lg">
						<RotateCcw className="size-3.5" />
					</button>
				</div>
			</div>

			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Web Access & Device Pairing
				</h4>

				<div className="flex items-center justify-between p-4 bg-void-bg-1 rounded-lg border border-void-border-2">
					<div>
						<div className="font-semibold text-xs text-white">Local Web Studio URL</div>
						<div className="font-mono text-cyan-400 text-sm mt-0.5">http://127.0.0.1:8000</div>
					</div>
					<button
						onClick={controller.openProsopon}
						className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
					>
						<ExternalLink className="size-3.5" />
						Open in Browser
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Require PIN Pairing</div>
							<div className="text-[11px] text-void-fg-3">Mandatory 6-digit PIN for remote phones/tablets.</div>
						</div>
						<VoidSwitch
							value={requirePin}
							onChange={(v) => {
								setRequirePin(v);
								storageService.store('metis.prosopon.requirePin', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Audio PTT Feedback</div>
							<div className="text-[11px] text-void-fg-3">Play sound chimes on voice query completion.</div>
						</div>
						<VoidSwitch
							value={audioFeedback}
							onChange={(v) => {
								setAudioFeedback(v);
								storageService.store('metis.prosopon.audioFeedback', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

// =========================================================================
// 7. Stoma / LTHCM Memory Section
// =========================================================================
export const StomaSection = () => {
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');
	const controller = useStackController();

	const [topK, setTopK] = useState(
		storageService.get('metis.stoma.topK', StorageScope.APPLICATION, '5')
	);
	const [autoSync, setAutoSync] = useState(
		storageService.getBoolean('metis.stoma.autoSync', StorageScope.APPLICATION, true)
	);

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Header */}
			<div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 rounded-xl p-5">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<HardDrive className="size-5 text-purple-400" />
						<h3 className="text-base font-bold text-white">Stoma / LTHCM Memory Engine</h3>
					</div>
					<span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
						GENERATION 2
					</span>
				</div>
				<p className="text-xs text-purple-200/80">
					Long-Term Hierarchical Context Memory indexing workspace files, code symbols, and architecture notes using local vector embeddings.
				</p>
			</div>

			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Vector Index & Retrieval
				</h4>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Memory Storage Root</label>
						<input
							type="text"
							readOnly
							value=".stoma/"
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono opacity-80"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Embedding Model</label>
						<input
							type="text"
							readOnly
							value="nomic-embed-text (Hestia :8080)"
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono opacity-80"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Top-K Retrieval Citations</label>
						<select
							value={topK}
							onChange={(e) => {
								setTopK(e.target.value);
								storageService.store('metis.stoma.topK', e.target.value, StorageScope.APPLICATION, StorageTarget.USER);
							}}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1"
						>
							<option value="3">3 chunks (Lean)</option>
							<option value="5">5 chunks (Standard)</option>
							<option value="10">10 chunks (Deep recall)</option>
						</select>
					</div>

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Auto-Index on Git Commit</div>
							<div className="text-[11px] text-void-fg-3">Ingest diffs into Stoma after git commit.</div>
						</div>
						<VoidSwitch
							value={autoSync}
							onChange={(v) => {
								setAutoSync(v);
								storageService.store('metis.stoma.autoSync', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>
				</div>

				<div className="pt-2 border-t border-void-border-2 flex justify-end">
					<button
						onClick={controller.rebuildMemoryIndex}
						className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white font-medium text-xs rounded-lg transition"
					>
						Rebuild Workspace Vector Index
					</button>
				</div>
			</div>
		</div>
	);
};
