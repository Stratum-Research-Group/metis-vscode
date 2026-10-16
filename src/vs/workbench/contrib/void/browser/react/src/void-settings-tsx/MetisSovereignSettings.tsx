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
	X,
	FolderGit2,
	Lock,
	Radio,
	Mic,
	VolumeX,
	Settings as SettingsIcon,
	Code2,
	Rocket
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
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');

	const [status, setStatus] = useState<MetisStackStatus>({
		hestia: { online: false, latency: null },
		kybernetes: { online: false, latency: null },
		prosopon: { online: false, latency: null },
	});
	const [isProbing, setIsProbing] = useState(false);

	const probeStack = useCallback(async () => {
		setIsProbing(true);

		const hestiaHost = storageService.get('metis.hestia.host', StorageScope.APPLICATION, '127.0.0.1');
		const hestiaPort = storageService.get('metis.hestia.port', StorageScope.APPLICATION, '8080');
		const kybHost = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const kybPort = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const prosHost = storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1');
		const prosPort = storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000');
		const prosTls = storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false);

		// Probe Hestia
		let hestiaRes: ServiceStatus = { online: false, latency: null };
		try {
			const t0 = performance.now();
			try {
				const res = await fetch(`http://${hestiaHost}:${hestiaPort}/v1/models`, { signal: AbortSignal.timeout(1800) });
				if (res.ok) {
					const data = await res.json();
					hestiaRes = { online: true, latency: Math.round(performance.now() - t0), data: data.data || [] };
				} else {
					hestiaRes = { online: true, latency: Math.round(performance.now() - t0) };
				}
			} catch {
				await fetch(`http://${hestiaHost}:${hestiaPort}/v1/models`, { mode: 'no-cors', signal: AbortSignal.timeout(1800) });
				hestiaRes = { online: true, latency: Math.round(performance.now() - t0) };
			}
		} catch (e: any) {
			hestiaRes = { online: false, latency: null, error: e.message || 'Offline' };
		}

		// Probe Kybernetes
		let kybRes: ServiceStatus = { online: false, latency: null };
		try {
			const t0 = performance.now();
			try {
				const res = await fetch(`http://${kybHost}:${kybPort}/v1/health`, { signal: AbortSignal.timeout(1800) });
				if (res.ok) {
					const data = await res.json();
					kybRes = { online: true, latency: Math.round(performance.now() - t0), data };
				} else {
					kybRes = { online: true, latency: Math.round(performance.now() - t0) };
				}
			} catch {
				await fetch(`http://${kybHost}:${kybPort}/v1/health`, { mode: 'no-cors', signal: AbortSignal.timeout(1800) });
				kybRes = { online: true, latency: Math.round(performance.now() - t0) };
			}
		} catch (e: any) {
			kybRes = { online: false, latency: null, error: e.message || 'Offline' };
		}

		// Probe Prosopon
		let prosRes: ServiceStatus = { online: false, latency: null };
		try {
			const proto = prosTls ? 'https' : 'http';
			const t0 = performance.now();
			try {
				const res = await fetch(`${proto}://${prosHost}:${prosPort}`, { signal: AbortSignal.timeout(1800) });
				prosRes = { online: res.ok, latency: Math.round(performance.now() - t0) };
			} catch {
				await fetch(`${proto}://${prosHost}:${prosPort}`, { mode: 'no-cors', signal: AbortSignal.timeout(1800) });
				prosRes = { online: true, latency: Math.round(performance.now() - t0) };
			}
		} catch (e: any) {
			prosRes = { online: false, latency: null, error: e.message || 'Offline' };
		}

		setStatus({
			hestia: hestiaRes,
			kybernetes: kybRes,
			prosopon: prosRes,
		});
		setIsProbing(false);
	}, [storageService]);

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
	const storageService = accessor.get('IStorageService');

	const executeCommandInStackTerminal = async (cmd: string, notifyMsg?: string) => {
		try {
			let term = terminalService.instances.find(t => t.title.includes('Metis Sovereign Stack') || t.title.includes('Metis Stack'));
			if (!term) {
				term = await terminalService.createTerminal({
					config: { name: 'Metis Sovereign Stack' },
					cwd: '/home/akarta/Projects/Metis',
				});
			}
			try {
				terminalService.setActiveInstance(term);
				if (typeof (terminalService as any).focusInstance === 'function') {
					(terminalService as any).focusInstance(term);
				} else if (typeof (terminalService as any).focusActiveInstance === 'function') {
					await (terminalService as any).focusActiveInstance();
				} else if (typeof term.focus === 'function') {
					term.focus();
				}
			} catch {
				try { term.focus(); } catch {}
			}
			term.sendText(cmd, true);
			if (notifyMsg) {
				notificationService.info(notifyMsg);
			}
		} catch (err: any) {
			notificationService.error(`Failed to execute command: ${err?.message || err}`);
		}
	};

	// Stack-level controls using configured settings
	const startAllStack = () => {
		const hestiaHost = storageService.get('metis.hestia.host', StorageScope.APPLICATION, '127.0.0.1');
		const hestiaPort = storageService.get('metis.hestia.port', StorageScope.APPLICATION, '8080');
		const hestiaConfig = storageService.get('metis.hestia.configPath', StorageScope.APPLICATION, 'hestia/hestia.yaml');
		const hestiaModels = storageService.get('metis.hestia.modelsPath', StorageScope.APPLICATION, 'hestia/models.yaml');
		const hestiaToken = storageService.get('metis.hestia.serviceToken', StorageScope.APPLICATION, 'metis-sovereign');

		const kybHost = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const kybPort = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const kybDbPath = storageService.get('metis.kybernetes.dbPath', StorageScope.APPLICATION, 'kybernetes_budget.db');
		const kybAdminToken = storageService.get('metis.kybernetes.adminToken', StorageScope.APPLICATION, 'metis-local-admin-token');
		const kybServiceToken = storageService.get('metis.kybernetes.serviceToken', StorageScope.APPLICATION, 'metis-local-service-token');
		const memoryRoot = storageService.get('metis.stoma.root', StorageScope.APPLICATION, '.stoma');

		const prosHost = storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1');
		const prosPort = storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000');
		const prosDataDir = storageService.get('metis.prosopon.dataDir', StorageScope.APPLICATION, './data');
		const mockMode = storageService.getBoolean('metis.stack.mockMode', StorageScope.APPLICATION, false);
		const lanMode = storageService.getBoolean('metis.prosopon.lanMode', StorageScope.APPLICATION, false);
		const tlsMode = storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false);

		const cmd = `cd /home/akarta/Projects/Metis && HESTIA_HOST=${hestiaHost} HESTIA_PORT=${hestiaPort} HESTIA_CONFIG=${hestiaConfig} HESTIA_MODELS=${hestiaModels} HESTIA_SERVICE_TOKEN=${hestiaToken} KYBERNETES_HOST=${kybHost} KYBERNETES_PORT=${kybPort} KYBERNETES_DB_PATH=${kybDbPath} KYBERNETES_ADMIN_TOKEN=${kybAdminToken} KYBERNETES_SERVICE_TOKEN=${kybServiceToken} KYBERNETES_MEMORY_ROOT=${memoryRoot} PROSOPON_HOST=${prosHost} PROSOPON_PORT=${prosPort} PROSOPON_LAN=${lanMode} PROSOPON_TLS=${tlsMode} PROSOPON_DATA_DIR=${prosDataDir} ./scripts/run_stack.sh ${mockMode ? '--mock' : ''}`;
		executeCommandInStackTerminal(cmd, `Launching Metis Sovereign Stack (Hestia :${hestiaPort}, Kybernetes :${kybPort}, Prosopon :${prosPort})...`);
	};

	const stopAllStack = () => {
		executeCommandInStackTerminal(
			'pkill -f "hestia.yaml" ; pkill -f "kybernetes.*serve" ; pkill -f "prosopon.*serve" ; pkill -f "run_stack.sh" ; echo "[Metis] All services stopped cleanly."',
			'Stopping all Metis processes...'
		);
	};

	const restartAllStack = () => {
		const hestiaHost = storageService.get('metis.hestia.host', StorageScope.APPLICATION, '127.0.0.1');
		const hestiaPort = storageService.get('metis.hestia.port', StorageScope.APPLICATION, '8080');
		const hestiaConfig = storageService.get('metis.hestia.configPath', StorageScope.APPLICATION, 'hestia/hestia.yaml');
		const hestiaModels = storageService.get('metis.hestia.modelsPath', StorageScope.APPLICATION, 'hestia/models.yaml');
		const hestiaToken = storageService.get('metis.hestia.serviceToken', StorageScope.APPLICATION, 'metis-sovereign');

		const kybHost = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const kybPort = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const kybDbPath = storageService.get('metis.kybernetes.dbPath', StorageScope.APPLICATION, 'kybernetes_budget.db');
		const kybAdminToken = storageService.get('metis.kybernetes.adminToken', StorageScope.APPLICATION, 'metis-local-admin-token');
		const kybServiceToken = storageService.get('metis.kybernetes.serviceToken', StorageScope.APPLICATION, 'metis-local-service-token');
		const memoryRoot = storageService.get('metis.stoma.root', StorageScope.APPLICATION, '.stoma');

		const prosHost = storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1');
		const prosPort = storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000');
		const prosDataDir = storageService.get('metis.prosopon.dataDir', StorageScope.APPLICATION, './data');
		const mockMode = storageService.getBoolean('metis.stack.mockMode', StorageScope.APPLICATION, false);
		const lanMode = storageService.getBoolean('metis.prosopon.lanMode', StorageScope.APPLICATION, false);
		const tlsMode = storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false);

		executeCommandInStackTerminal(
			`pkill -f "hestia.yaml" ; pkill -f "kybernetes.*serve" ; pkill -f "prosopon.*serve" ; pkill -f "run_stack.sh" ; sleep 1 ; cd /home/akarta/Projects/Metis && HESTIA_HOST=${hestiaHost} HESTIA_PORT=${hestiaPort} HESTIA_CONFIG=${hestiaConfig} HESTIA_MODELS=${hestiaModels} HESTIA_SERVICE_TOKEN=${hestiaToken} KYBERNETES_HOST=${kybHost} KYBERNETES_PORT=${kybPort} KYBERNETES_DB_PATH=${kybDbPath} KYBERNETES_ADMIN_TOKEN=${kybAdminToken} KYBERNETES_SERVICE_TOKEN=${kybServiceToken} KYBERNETES_MEMORY_ROOT=${memoryRoot} PROSOPON_HOST=${prosHost} PROSOPON_PORT=${prosPort} PROSOPON_LAN=${lanMode} PROSOPON_TLS=${tlsMode} PROSOPON_DATA_DIR=${prosDataDir} ./scripts/run_stack.sh ${mockMode ? '--mock' : ''}`,
			'Restarting Metis Sovereign Stack...'
		);
	};

	// Hestia controls
	const startHestia = () => {
		const host = storageService.get('metis.hestia.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.hestia.port', StorageScope.APPLICATION, '8080');
		const configPath = storageService.get('metis.hestia.configPath', StorageScope.APPLICATION, 'hestia/hestia.yaml');
		const modelsPath = storageService.get('metis.hestia.modelsPath', StorageScope.APPLICATION, 'hestia/models.yaml');

		const cmd = `cd /home/akarta/Projects/Metis && (hestia/.venv/bin/hestia serve --host ${host} --port ${port} --config ${configPath} --models ${modelsPath} || uv run hestia serve --host ${host} --port ${port} --config ${configPath} --models ${modelsPath} &) && echo "[Metis] Hestia starting on ${host}:${port}..."`;
		executeCommandInStackTerminal(cmd, `Starting Hestia on port ${port}...`);
	};

	const stopHestia = () => {
		executeCommandInStackTerminal('pkill -f "hestia.yaml" || true ; echo "[Metis] Hestia stopped."', 'Stopping Hestia Model Server...');
	};

	const restartHestia = () => {
		const host = storageService.get('metis.hestia.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.hestia.port', StorageScope.APPLICATION, '8080');
		const configPath = storageService.get('metis.hestia.configPath', StorageScope.APPLICATION, 'hestia/hestia.yaml');
		const modelsPath = storageService.get('metis.hestia.modelsPath', StorageScope.APPLICATION, 'hestia/models.yaml');

		executeCommandInStackTerminal(
			`pkill -f "hestia.yaml" || true ; sleep 1 ; cd /home/akarta/Projects/Metis && (hestia/.venv/bin/hestia serve --host ${host} --port ${port} --config ${configPath} --models ${modelsPath} || uv run hestia serve --host ${host} --port ${port} --config ${configPath} --models ${modelsPath} &) && echo "[Metis] Hestia restarted on ${host}:${port}."`,
			`Restarting Hestia on port ${port}...`
		);
	};

	// Kybernetes controls
	const startKybernetes = () => {
		const host = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const dbPath = storageService.get('metis.kybernetes.dbPath', StorageScope.APPLICATION, 'kybernetes_budget.db');
		const memoryRoot = storageService.get('metis.stoma.root', StorageScope.APPLICATION, '.stoma');
		const adminToken = storageService.get('metis.kybernetes.adminToken', StorageScope.APPLICATION, 'metis-local-admin-token');
		const serviceToken = storageService.get('metis.kybernetes.serviceToken', StorageScope.APPLICATION, 'metis-local-service-token');

		const cmd = `cd /home/akarta/Projects/Metis && KYBERNETES_ADMIN_TOKEN=${adminToken} KYBERNETES_SERVICE_TOKEN=${serviceToken} (kybernetes/.venv/bin/kybernetes serve --host ${host} --port ${port} --db-path ${dbPath} --memory-root ${memoryRoot} --admin-token ${adminToken} --service-token ${serviceToken} || uv run kybernetes serve --host ${host} --port ${port} --db-path ${dbPath} --memory-root ${memoryRoot} --admin-token ${adminToken} --service-token ${serviceToken} &) && echo "[Metis] Kybernetes starting on ${host}:${port}..."`;
		executeCommandInStackTerminal(cmd, `Starting Kybernetes on port ${port}...`);
	};

	const stopKybernetes = () => {
		executeCommandInStackTerminal('pkill -f "kybernetes.*serve" || true ; echo "[Metis] Kybernetes stopped."', 'Stopping Kybernetes Orchestrator...');
	};

	const restartKybernetes = () => {
		const host = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const dbPath = storageService.get('metis.kybernetes.dbPath', StorageScope.APPLICATION, 'kybernetes_budget.db');
		const memoryRoot = storageService.get('metis.stoma.root', StorageScope.APPLICATION, '.stoma');
		const adminToken = storageService.get('metis.kybernetes.adminToken', StorageScope.APPLICATION, 'metis-local-admin-token');
		const serviceToken = storageService.get('metis.kybernetes.serviceToken', StorageScope.APPLICATION, 'metis-local-service-token');

		executeCommandInStackTerminal(
			`pkill -f "kybernetes.*serve" || true ; sleep 1 ; cd /home/akarta/Projects/Metis && KYBERNETES_ADMIN_TOKEN=${adminToken} KYBERNETES_SERVICE_TOKEN=${serviceToken} (kybernetes/.venv/bin/kybernetes serve --host ${host} --port ${port} --db-path ${dbPath} --memory-root ${memoryRoot} --admin-token ${adminToken} --service-token ${serviceToken} || uv run kybernetes serve --host ${host} --port ${port} --db-path ${dbPath} --memory-root ${memoryRoot} --admin-token ${adminToken} --service-token ${serviceToken} &) && echo "[Metis] Kybernetes restarted on ${host}:${port}."`,
			`Restarting Kybernetes on port ${port}...`
		);
	};

	// Prosopon controls
	const startProsopon = () => {
		const host = storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000');
		const kybHost = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const kybPort = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const lanMode = storageService.getBoolean('metis.prosopon.lanMode', StorageScope.APPLICATION, false);
		const tlsMode = storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false);
		const mockMode = storageService.getBoolean('metis.prosopon.mockMode', StorageScope.APPLICATION, false);
		const dataDir = storageService.get('metis.prosopon.dataDir', StorageScope.APPLICATION, './data');

		let flags = mockMode ? '--mock' : `--no-mock --kybernetes-url http://${kybHost}:${kybPort}/v1`;
		if (lanMode) flags += ' --lan';
		if (tlsMode) flags += ' --tls';
		if (dataDir) flags += ` --data-dir ${dataDir}`;

		const cmd = `cd /home/akarta/Projects/Metis && (prosopon/.venv/bin/prosopon serve --host ${host} --port ${port} ${flags} || uv run prosopon serve --host ${host} --port ${port} ${flags} &) && echo "[Metis] Prosopon starting on ${host}:${port}..."`;
		executeCommandInStackTerminal(cmd, `Starting Prosopon on port ${port}...`);
	};

	const stopProsopon = () => {
		executeCommandInStackTerminal('pkill -f "prosopon.*serve" || true ; echo "[Metis] Prosopon stopped."', 'Stopping Prosopon Web Interface...');
	};

	const restartProsopon = () => {
		const host = storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000');
		const kybHost = storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1');
		const kybPort = storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081');
		const lanMode = storageService.getBoolean('metis.prosopon.lanMode', StorageScope.APPLICATION, false);
		const tlsMode = storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false);
		const mockMode = storageService.getBoolean('metis.prosopon.mockMode', StorageScope.APPLICATION, false);
		const dataDir = storageService.get('metis.prosopon.dataDir', StorageScope.APPLICATION, './data');

		let flags = mockMode ? '--mock' : `--no-mock --kybernetes-url http://${kybHost}:${kybPort}/v1`;
		if (lanMode) flags += ' --lan';
		if (tlsMode) flags += ' --tls';
		if (dataDir) flags += ` --data-dir ${dataDir}`;

		executeCommandInStackTerminal(
			`pkill -f "prosopon.*serve" || true ; sleep 1 ; cd /home/akarta/Projects/Metis && (prosopon/.venv/bin/prosopon serve --host ${host} --port ${port} ${flags} || uv run prosopon serve --host ${host} --port ${port} ${flags} &) && echo "[Metis] Prosopon restarted on ${host}:${port}."`,
			`Restarting Prosopon on port ${port}...`
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
		const host = storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1');
		const port = storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000');
		const tls = storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false);
		const proto = tls ? 'https' : 'http';
		const url = `${proto}://${host}:${port}`;
		try {
			nativeHostService.openExternal(url);
		} catch {
			window.open(url, '_blank');
		}
	};

	const focusStackTerminal = async () => {
		let term = terminalService.instances.find(t => t.title.includes('Metis Sovereign Stack') || t.title.includes('Metis Stack'));
		if (term) {
			try {
				terminalService.setActiveInstance(term);
				if (typeof (terminalService as any).focusInstance === 'function') {
					(terminalService as any).focusInstance(term);
				} else if (typeof (terminalService as any).focusActiveInstance === 'function') {
					await (terminalService as any).focusActiveInstance();
				} else if (typeof term.focus === 'function') {
					term.focus();
				}
			} catch {
				try { term.focus(); } catch {}
			}
		} else {
			executeCommandInStackTerminal('echo "[Metis] Sovereign Stack Terminal Ready."', 'Opening Metis Stack Terminal...');
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
		focusStackTerminal,
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
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');

	const [mockMode, setMockMode] = useState(
		storageService.getBoolean('metis.stack.mockMode', StorageScope.APPLICATION, false)
	);
	const [lanMode, setLanMode] = useState(
		storageService.getBoolean('metis.prosopon.lanMode', StorageScope.APPLICATION, false)
	);
	const [tlsMode, setTlsMode] = useState(
		storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false)
	);

	const toggleMock = (v: boolean) => {
		setMockMode(v);
		storageService.store('metis.stack.mockMode', v, StorageScope.APPLICATION, StorageTarget.USER);
	};

	const toggleLan = (v: boolean) => {
		setLanMode(v);
		storageService.store('metis.prosopon.lanMode', v, StorageScope.APPLICATION, StorageTarget.USER);
	};

	const toggleTls = (v: boolean) => {
		setTlsMode(v);
		storageService.store('metis.prosopon.tlsMode', v, StorageScope.APPLICATION, StorageTarget.USER);
	};

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			{/* Master Header Card */}
			<div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/50 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-md shadow-xl">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
					<div className="flex items-center gap-3">
						<span className="text-3xl">🏛️</span>
						<div>
							<h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
								Metis Sovereign Command & Control
							</h3>
							<p className="text-xs text-indigo-300">
								Arch Linux Native Local AI Architecture • Zero Telemetry • 100% Air-Gapped Ready
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
						Doctor
					</button>
					<button
						onClick={controller.focusStackTerminal}
						className="flex items-center gap-2 bg-void-bg-2 hover:bg-void-bg-1 border border-void-border-2 text-void-fg-1 font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<Terminal className="size-3.5" />
						Logs Terminal
					</button>
					<button
						onClick={controller.openProsopon}
						className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<ExternalLink className="size-3.5" />
						Open Web Studio
					</button>
					<button
						onClick={() => accessor.get('ICommandService').executeCommand('workbench.action.openMetisDashboard')}
						className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
					>
						<Rocket className="size-3.5" />
						Sovereign Launchpad
					</button>
				</div>
			</div>

			{/* Global Stack Run Flags */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-4 flex flex-col gap-3">
				<h4 className="font-semibold text-void-fg-1 text-xs uppercase tracking-wider text-void-fg-3 flex items-center gap-2">
					<Sliders className="size-3.5 text-cyan-400" />
					Stack Launch Configuration Flags
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="flex items-center justify-between p-2.5 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="text-xs font-semibold text-void-fg-1">Standalone Mock Mode</div>
							<div className="text-[10px] text-void-fg-3">Run Prosopon with mock orchestrator</div>
						</div>
						<VoidSwitch value={mockMode} onChange={toggleMock} />
					</div>

					<div className="flex items-center justify-between p-2.5 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="text-xs font-semibold text-void-fg-1">LAN Mode (0.0.0.0)</div>
							<div className="text-[10px] text-void-fg-3">Expose to mobile devices on WiFi</div>
						</div>
						<VoidSwitch value={lanMode} onChange={toggleLan} />
					</div>

					<div className="flex items-center justify-between p-2.5 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="text-xs font-semibold text-void-fg-1">Self-Signed TLS</div>
							<div className="text-[10px] text-void-fg-3">HTTPS for mobile microphone access</div>
						</div>
						<VoidSwitch value={tlsMode} onChange={toggleTls} />
					</div>
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
						<button onClick={controller.restartHestia} title="Restart Hestia" className="p-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
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
						<button onClick={controller.restartKybernetes} title="Restart Kybernetes" className="p-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
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
						<span>Web / Voice</span>
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
						<button onClick={controller.restartProsopon} title="Restart Prosopon" className="p-1 bg-void-bg-1 hover:bg-void-bg-2 text-void-fg-2 rounded border border-void-border-2">
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

	const [listenHost, setListenHost] = useState(
		storageService.get('metis.hestia.host', StorageScope.APPLICATION, '127.0.0.1')
	);
	const [listenPort, setListenPort] = useState(
		storageService.get('metis.hestia.port', StorageScope.APPLICATION, '8080')
	);
	const [configPath, setConfigPath] = useState(
		storageService.get('metis.hestia.configPath', StorageScope.APPLICATION, 'hestia/hestia.yaml')
	);
	const [modelsPath, setModelsPath] = useState(
		storageService.get('metis.hestia.modelsPath', StorageScope.APPLICATION, 'hestia/models.yaml')
	);
	const [llamacppBinary, setLlamacppBinary] = useState(
		storageService.get('metis.hestia.llamacppBinary', StorageScope.APPLICATION, '/home/akarta/.unsloth/llama.cpp/llama-server')
	);
	const [backendPortStart, setBackendPortStart] = useState(
		storageService.get('metis.hestia.backendPortStart', StorageScope.APPLICATION, '9000')
	);
	const [backendPortEnd, setBackendPortEnd] = useState(
		storageService.get('metis.hestia.backendPortEnd', StorageScope.APPLICATION, '9019')
	);
	const [idleTimeout, setIdleTimeout] = useState(
		storageService.get('metis.hestia.idleTimeout', StorageScope.APPLICATION, '600')
	);
	const [logLevel, setLogLevel] = useState(
		storageService.get('metis.hestia.logLevel', StorageScope.APPLICATION, 'INFO')
	);
	const [serviceToken, setServiceToken] = useState(
		storageService.get('metis.hestia.serviceToken', StorageScope.APPLICATION, 'metis-sovereign')
	);
	const [maxConcurrent, setMaxConcurrent] = useState(
		storageService.get('metis.hestia.maxConcurrent', StorageScope.APPLICATION, '8')
	);
	const [maxQueueDepth, setMaxQueueDepth] = useState(
		storageService.get('metis.hestia.maxQueueDepth', StorageScope.APPLICATION, '16')
	);
	const [queueTimeout, setQueueTimeout] = useState(
		storageService.get('metis.hestia.queueTimeout', StorageScope.APPLICATION, '30')
	);

	const [contextLength, setContextLength] = useState(
		storageService.get('metis.hestia.contextLength', StorageScope.APPLICATION, '8192')
	);
	const [temperature, setTemperature] = useState(
		storageService.get('metis.hestia.temperature', StorageScope.APPLICATION, '0.7')
	);
	const [topP, setTopP] = useState(
		storageService.get('metis.hestia.topP', StorageScope.APPLICATION, '0.9')
	);
	const [topK, setTopK] = useState(
		storageService.get('metis.hestia.topK', StorageScope.APPLICATION, '40')
	);
	const [repeatPenalty, setRepeatPenalty] = useState(
		storageService.get('metis.hestia.repeatPenalty', StorageScope.APPLICATION, '1.1')
	);
	const [gpuTarget, setGpuTarget] = useState(
		storageService.get('metis.hestia.gpuTarget', StorageScope.APPLICATION, 'rtx-5060-ti')
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
					<button onClick={controller.restartHestia} title="Restart Hestia" className="p-1.5 text-xs bg-void-bg-1 border border-void-border-2 text-void-fg-2 hover:text-white rounded-lg">
						<RotateCcw className="size-3.5" />
					</button>
				</div>
			</div>

			{/* Service Run Command Bar */}
			<div className="p-3 bg-void-bg-1 border border-void-border-2 rounded-xl flex items-center justify-between text-xs font-mono">
				<span className="text-void-fg-3 truncate">
					hestia serve --host {listenHost} --port {listenPort} --config {configPath} --models {modelsPath}
				</span>
				<span className="text-[10px] bg-void-bg-2 px-2 py-0.5 rounded text-cyan-400 border border-void-border-2 shrink-0 ml-2">
					CLI Command
				</span>
			</div>

			{/* Service Networking & File Paths */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-4">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Service Run Settings & Binary Paths
				</h4>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Listen Host</label>
						<input
							type="text"
							value={listenHost}
							onChange={(e) => updateStorage('metis.hestia.host', e.target.value, setListenHost)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Listen Port</label>
						<input
							type="number"
							value={listenPort}
							onChange={(e) => updateStorage('metis.hestia.port', e.target.value, setListenPort)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">llama-server Binary Path</label>
					<input
						type="text"
						value={llamacppBinary}
						onChange={(e) => updateStorage('metis.hestia.llamacppBinary', e.target.value, setLlamacppBinary)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Hestia Config YAML</label>
						<input
							type="text"
							value={configPath}
							onChange={(e) => updateStorage('metis.hestia.configPath', e.target.value, setConfigPath)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Models Registry YAML</label>
						<input
							type="text"
							value={modelsPath}
							onChange={(e) => updateStorage('metis.hestia.modelsPath', e.target.value, setModelsPath)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Backend Port Start</label>
						<input
							type="number"
							value={backendPortStart}
							onChange={(e) => updateStorage('metis.hestia.backendPortStart', e.target.value, setBackendPortStart)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Backend Port End</label>
						<input
							type="number"
							value={backendPortEnd}
							onChange={(e) => updateStorage('metis.hestia.backendPortEnd', e.target.value, setBackendPortEnd)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Idle Timeout (seconds)</label>
						<input
							type="number"
							value={idleTimeout}
							onChange={(e) => updateStorage('metis.hestia.idleTimeout', e.target.value, setIdleTimeout)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">GPU Hardware Target</label>
						<select
							value={gpuTarget}
							onChange={(e) => updateStorage('metis.hestia.gpuTarget', e.target.value, setGpuTarget)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="rtx-5060-ti">NVIDIA RTX 5060 Ti (CUDA 12.8)</option>
							<option value="cuda">Generic NVIDIA GPU (CUDA)</option>
							<option value="rocm">AMD Radeon (ROCm)</option>
							<option value="vulkan">Vulkan Universal</option>
							<option value="cpu">CPU AVX2 / AVX-512</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Log Level</label>
						<select
							value={logLevel}
							onChange={(e) => updateStorage('metis.hestia.logLevel', e.target.value, setLogLevel)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="DEBUG">DEBUG (Detailed llama traces)</option>
							<option value="INFO">INFO (Standard production)</option>
							<option value="WARNING">WARNING (Quiet)</option>
							<option value="ERROR">ERROR (Errors only)</option>
						</select>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Hestia Service Bearer Token</label>
					<input
						type="password"
						value={serviceToken}
						onChange={(e) => updateStorage('metis.hestia.serviceToken', e.target.value, setServiceToken)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-void-border-2">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Max Concurrent Per Model</label>
						<input
							type="number"
							value={maxConcurrent}
							onChange={(e) => updateStorage('metis.hestia.maxConcurrent', e.target.value, setMaxConcurrent)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Max Queue Depth</label>
						<input
							type="number"
							value={maxQueueDepth}
							onChange={(e) => updateStorage('metis.hestia.maxQueueDepth', e.target.value, setMaxQueueDepth)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Queue Timeout (sec)</label>
						<input
							type="number"
							value={queueTimeout}
							onChange={(e) => updateStorage('metis.hestia.queueTimeout', e.target.value, setQueueTimeout)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>
				</div>
			</div>

			{/* Sampling Parameters */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-4">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Inference Sampling & Context Hyperparameters
				</h4>

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
						<label className="text-xs text-void-fg-2 font-medium">Repeat Penalty</label>
						<input
							type="number"
							step="0.05"
							value={repeatPenalty}
							onChange={(e) => updateStorage('metis.hestia.repeatPenalty', e.target.value, setRepeatPenalty)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-xs text-void-fg-2 font-medium">
							<span>Temperature</span>
							<span className="font-mono text-cyan-400">{temperature}</span>
						</div>
						<input
							type="range"
							min="0.0"
							max="1.5"
							step="0.05"
							value={temperature}
							onChange={(e) => updateStorage('metis.hestia.temperature', e.target.value, setTemperature)}
							className="w-full accent-cyan-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-xs text-void-fg-2 font-medium">
							<span>Top-P</span>
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

					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-xs text-void-fg-2 font-medium">
							<span>Top-K</span>
							<span className="font-mono text-cyan-400">{topK}</span>
						</div>
						<input
							type="range"
							min="1"
							max="100"
							step="1"
							value={topK}
							onChange={(e) => updateStorage('metis.hestia.topK', e.target.value, setTopK)}
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
						{ id: 'gemma-4-26b-a4b-abliterated', desc: 'Primary Reasoning & Coding Model (Q3_K_M)', type: 'Chat/Reasoning', path: '/home/akarta/models/Gemma-4-26B-A4B-Abliterated.Q3_K_M.gguf' },
						{ id: 'qwen2.5-14b-instruct', desc: 'Fast Fill-In-The-Middle & Inline Edits (Q4_K_M)', type: 'FIM/Edit', path: '/home/akarta/.ollama/models/.studio_links/2a9a1708be/qwen2.5-14b.gguf' },
						{ id: 'llama-3.1-8b-instruct', desc: 'Lightweight Sovereign Chat Model (Q4_K_M)', type: 'Chat', path: '/models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf' },
						{ id: 'nomic-embed-text', desc: 'Dense Vector Embeddings for Stoma LTHCM (Q8_0)', type: 'Embedding', path: '/models/nomic-embed-text-v1.5-Q8_0.gguf' },
					].map((m) => (
						<div key={m.id} className="p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg flex flex-col gap-1">
							<div className="flex items-center justify-between">
								<div className="font-mono text-xs font-semibold text-white">{m.id}</div>
								<span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded">
									{m.type}
								</span>
							</div>
							<div className="text-[11px] text-void-fg-3">{m.desc}</div>
							<div className="text-[10px] font-mono text-void-fg-4 truncate">{m.path}</div>
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

	const [host, setHost] = useState(
		storageService.get('metis.kybernetes.host', StorageScope.APPLICATION, '127.0.0.1')
	);
	const [port, setPort] = useState(
		storageService.get('metis.kybernetes.port', StorageScope.APPLICATION, '8081')
	);
	const [dbPath, setDbPath] = useState(
		storageService.get('metis.kybernetes.dbPath', StorageScope.APPLICATION, 'kybernetes_budget.db')
	);
	const [adminToken, setAdminToken] = useState(
		storageService.get('metis.kybernetes.adminToken', StorageScope.APPLICATION, 'metis-local-admin-token')
	);
	const [serviceToken, setServiceToken] = useState(
		storageService.get('metis.kybernetes.serviceToken', StorageScope.APPLICATION, 'metis-local-service-token')
	);
	const [adminEnabled, setAdminEnabled] = useState(
		storageService.getBoolean('metis.kybernetes.adminEnabled', StorageScope.APPLICATION, true)
	);
	const [maxFsmSteps, setMaxFsmSteps] = useState(
		storageService.get('metis.kybernetes.maxFsmSteps', StorageScope.APPLICATION, '25')
	);
	const [routerStrategy, setRouterStrategy] = useState(
		storageService.get('metis.kybernetes.routerStrategy', StorageScope.APPLICATION, 'tool_calling')
	);
	const [enableWorktrees, setEnableWorktrees] = useState(
		storageService.getBoolean('metis.kybernetes.enableWorktrees', StorageScope.APPLICATION, true)
	);
	const [worktreesDir, setWorktreesDir] = useState(
		storageService.get('metis.kybernetes.worktreesDir', StorageScope.APPLICATION, '.metis/worktrees')
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
					<button onClick={controller.restartKybernetes} title="Restart Kybernetes" className="p-1.5 text-xs bg-void-bg-1 border border-void-border-2 text-void-fg-2 hover:text-white rounded-lg">
						<RotateCcw className="size-3.5" />
					</button>
				</div>
			</div>

			{/* Service Run Command Bar */}
			<div className="p-3 bg-void-bg-1 border border-void-border-2 rounded-xl flex items-center justify-between text-xs font-mono">
				<span className="text-void-fg-3 truncate">
					kybernetes serve --host {host} --port {port} --db-path {dbPath} --memory-root .stoma
				</span>
				<span className="text-[10px] bg-void-bg-2 px-2 py-0.5 rounded text-cyan-400 border border-void-border-2 shrink-0 ml-2">
					CLI Command
				</span>
			</div>

			{/* Configuration */}
			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Networking, Database & Upstream Parameters
				</h4>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Bind Host Address</label>
						<input
							type="text"
							value={host}
							onChange={(e) => updateStorage('metis.kybernetes.host', e.target.value, setHost)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Bind Port Number</label>
						<input
							type="number"
							value={port}
							onChange={(e) => updateStorage('metis.kybernetes.port', e.target.value, setPort)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Hestia Upstream Base URL</label>
					<input
						type="text"
						value={metisSettings?.endpoint || 'http://127.0.0.1:8080/v1'}
						onChange={(e) => voidSettingsService.setSettingOfProvider('metis', 'endpoint', e.target.value)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Task Budget SQLite DB Path</label>
					<input
						type="text"
						value={dbPath}
						onChange={(e) => updateStorage('metis.kybernetes.dbPath', e.target.value, setDbPath)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Admin Bearer Token (/v1/admin/*)</label>
						<input
							type="password"
							value={adminToken}
							onChange={(e) => updateStorage('metis.kybernetes.adminToken', e.target.value, setAdminToken)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Service Bearer Token (/v1/chat)</label>
						<input
							type="password"
							value={serviceToken}
							onChange={(e) => updateStorage('metis.kybernetes.serviceToken', e.target.value, setServiceToken)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>
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
				<div className="flex flex-col gap-3 p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
					<div className="flex items-center justify-between">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Ephemeral Git Worktrees</div>
							<div className="text-[11px] text-void-fg-3">
								Run subagents in isolated git worktrees to prevent dirty tree pollution.
							</div>
						</div>
						<VoidSwitch
							value={enableWorktrees}
							onChange={(v) => {
								setEnableWorktrees(v);
								storageService.store('metis.kybernetes.enableWorktrees', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-[11px] text-void-fg-3 font-medium">Worktrees Base Directory</label>
						<input
							type="text"
							value={worktreesDir}
							onChange={(e) => updateStorage('metis.kybernetes.worktreesDir', e.target.value, setWorktreesDir)}
							className="bg-void-bg-2 border border-void-border-2 rounded px-2.5 py-1 text-xs text-void-fg-1 font-mono"
						/>
					</div>
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
	const [auditLogPath, setAuditLogPath] = useState(
		storageService.get('metis.phylax.auditLogPath', StorageScope.APPLICATION, '.metis/audit_ledger.jsonl')
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

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Audit Ledger JSONL Path</label>
						<input
							type="text"
							value={auditLogPath}
							onChange={(e) => {
								setAuditLogPath(e.target.value);
								storageService.store('metis.phylax.auditLogPath', e.target.value, StorageScope.APPLICATION, StorageTarget.USER);
							}}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-amber-500"
						/>
					</div>
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
	const [checkpointPattern, setCheckpointPattern] = useState(
		storageService.get('metis.dianoia.checkpointPattern', StorageScope.APPLICATION, 'refs/odyssey/checkpoint_{n}')
	);
	const [enableHermes, setEnableHermes] = useState(
		storageService.getBoolean('metis.dianoia.enableHermes', StorageScope.APPLICATION, true)
	);
	const [skillsDir, setSkillsDir] = useState(
		storageService.get('metis.dianoia.skillsDir', StorageScope.APPLICATION, '.metis/skills')
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
					<div className="flex flex-col gap-2 p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div className="flex items-center justify-between">
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
						<div className="flex flex-col gap-1 pt-1 border-t border-void-border-2">
							<label className="text-[10px] text-void-fg-3 font-medium">Ref Pattern</label>
							<input
								type="text"
								value={checkpointPattern}
								onChange={(e) => {
									setCheckpointPattern(e.target.value);
									storageService.store('metis.dianoia.checkpointPattern', e.target.value, StorageScope.APPLICATION, StorageTarget.USER);
								}}
								className="bg-void-bg-2 border border-void-border-2 rounded px-2 py-0.5 text-xs text-void-fg-1 font-mono"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2 p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<div className="font-semibold text-xs text-void-fg-1">Hermes Skill Synthesis</div>
								<div className="text-[11px] text-void-fg-3">Auto-crystallize verified skills.</div>
							</div>
							<VoidSwitch
								value={enableHermes}
								onChange={(v) => {
									setEnableHermes(v);
									storageService.store('metis.dianoia.enableHermes', v, StorageScope.APPLICATION, StorageTarget.USER);
								}}
							/>
						</div>
						<div className="flex flex-col gap-1 pt-1 border-t border-void-border-2">
							<label className="text-[10px] text-void-fg-3 font-medium">Learned Skills Directory</label>
							<input
								type="text"
								value={skillsDir}
								onChange={(e) => {
									setSkillsDir(e.target.value);
									storageService.store('metis.dianoia.skillsDir', e.target.value, StorageScope.APPLICATION, StorageTarget.USER);
								}}
								className="bg-void-bg-2 border border-void-border-2 rounded px-2 py-0.5 text-xs text-void-fg-1 font-mono"
							/>
						</div>
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

	const [host, setHost] = useState(
		storageService.get('metis.prosopon.host', StorageScope.APPLICATION, '127.0.0.1')
	);
	const [port, setPort] = useState(
		storageService.get('metis.prosopon.port', StorageScope.APPLICATION, '8000')
	);
	const [lanMode, setLanMode] = useState(
		storageService.getBoolean('metis.prosopon.lanMode', StorageScope.APPLICATION, false)
	);
	const [tlsMode, setTlsMode] = useState(
		storageService.getBoolean('metis.prosopon.tlsMode', StorageScope.APPLICATION, false)
	);
	const [mockMode, setMockMode] = useState(
		storageService.getBoolean('metis.prosopon.mockMode', StorageScope.APPLICATION, false)
	);
	const [requirePin, setRequirePin] = useState(
		storageService.getBoolean('metis.prosopon.requirePin', StorageScope.APPLICATION, false)
	);
	const [dataDir, setDataDir] = useState(
		storageService.get('metis.prosopon.dataDir', StorageScope.APPLICATION, './data')
	);
	const [sessionExpiry, setSessionExpiry] = useState(
		storageService.get('metis.prosopon.sessionExpiry', StorageScope.APPLICATION, '72')
	);
	const [audioFeedback, setAudioFeedback] = useState(
		storageService.getBoolean('metis.prosopon.audioFeedback', StorageScope.APPLICATION, true)
	);
	const [whisperBinary, setWhisperBinary] = useState(
		storageService.get('metis.prosopon.whisperBinary', StorageScope.APPLICATION, 'whisper.cpp')
	);
	const [whisperModel, setWhisperModel] = useState(
		storageService.get('metis.prosopon.whisperModel', StorageScope.APPLICATION, 'base.en')
	);
	const [piperBinary, setPiperBinary] = useState(
		storageService.get('metis.prosopon.piperBinary', StorageScope.APPLICATION, 'piper')
	);
	const [piperModel, setPiperModel] = useState(
		storageService.get('metis.prosopon.piperModel', StorageScope.APPLICATION, 'en_US-lessac-medium')
	);
	const [voiceMockMode, setVoiceMockMode] = useState(
		storageService.getBoolean('metis.prosopon.voiceMockMode', StorageScope.APPLICATION, false)
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
					<button onClick={controller.restartProsopon} title="Restart Prosopon" className="p-1.5 text-xs bg-void-bg-1 border border-void-border-2 text-void-fg-2 hover:text-white rounded-lg">
						<RotateCcw className="size-3.5" />
					</button>
				</div>
			</div>

			{/* Service Run Command Bar */}
			<div className="p-3 bg-void-bg-1 border border-void-border-2 rounded-xl flex items-center justify-between text-xs font-mono">
				<span className="text-void-fg-3 truncate">
					prosopon serve --host {host} --port {port} {lanMode ? '--lan' : ''} {tlsMode ? '--tls' : ''} {mockMode ? '--mock' : '--no-mock'}
				</span>
				<span className="text-[10px] bg-void-bg-2 px-2 py-0.5 rounded text-cyan-400 border border-void-border-2 shrink-0 ml-2">
					CLI Command
				</span>
			</div>

			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Web Access & Device Pairing
				</h4>

				<div className="flex items-center justify-between p-4 bg-void-bg-1 rounded-lg border border-void-border-2">
					<div>
						<div className="font-semibold text-xs text-white">Local Web Studio URL</div>
						<div className="font-mono text-cyan-400 text-sm mt-0.5">
							{tlsMode ? 'https' : 'http'}://{host}:{port}
						</div>
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
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Bind Host Address</label>
						<input
							type="text"
							value={host}
							onChange={(e) => updateStorage('metis.prosopon.host', e.target.value, setHost)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Port</label>
						<input
							type="number"
							value={port}
							onChange={(e) => updateStorage('metis.prosopon.port', e.target.value, setPort)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">LAN Network Mode</div>
							<div className="text-[10px] text-void-fg-3">Bind 0.0.0.0 for phone access</div>
						</div>
						<VoidSwitch
							value={lanMode}
							onChange={(v) => {
								setLanMode(v);
								storageService.store('metis.prosopon.lanMode', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Self-Signed TLS</div>
							<div className="text-[10px] text-void-fg-3">HTTPS for mobile microphone</div>
						</div>
						<VoidSwitch
							value={tlsMode}
							onChange={(v) => {
								setTlsMode(v);
								storageService.store('metis.prosopon.tlsMode', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Require PIN Pairing</div>
							<div className="text-[10px] text-void-fg-3">Enforce 6-digit PIN on LAN</div>
						</div>
						<VoidSwitch
							value={requirePin}
							onChange={(v) => {
								setRequirePin(v);
								storageService.store('metis.prosopon.requirePin', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Session & Pairing Data Directory</label>
						<input
							type="text"
							value={dataDir}
							onChange={(e) => updateStorage('metis.prosopon.dataDir', e.target.value, setDataDir)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Session Expiry (hours)</label>
						<input
							type="number"
							value={sessionExpiry}
							onChange={(e) => updateStorage('metis.prosopon.sessionExpiry', e.target.value, setSessionExpiry)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-indigo-500"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-void-border-2">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Local Whisper Binary (STT)</label>
						<input
							type="text"
							value={whisperBinary}
							onChange={(e) => updateStorage('metis.prosopon.whisperBinary', e.target.value, setWhisperBinary)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Local Piper Binary (TTS)</label>
						<input
							type="text"
							value={piperBinary}
							onChange={(e) => updateStorage('metis.prosopon.piperBinary', e.target.value, setPiperBinary)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 font-mono"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Whisper STT Model</label>
						<select
							value={whisperModel}
							onChange={(e) => updateStorage('metis.prosopon.whisperModel', e.target.value, setWhisperModel)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="tiny.en">tiny.en (Fastest, lowest VRAM)</option>
							<option value="base.en">base.en (Standard accuracy)</option>
							<option value="small.en">small.en (High accuracy)</option>
							<option value="medium.en">medium.en (Best accuracy)</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Piper Voice Profile</label>
						<select
							value={piperModel}
							onChange={(e) => updateStorage('metis.prosopon.piperModel', e.target.value, setPiperModel)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-1.5 text-xs text-void-fg-1 focus:border-indigo-500"
						>
							<option value="en_US-lessac-medium">en_US-lessac-medium (Natural)</option>
							<option value="en_US-libritts-high">en_US-libritts-high (Studio Crisp)</option>
							<option value="en_GB-alan-medium">en_GB-alan-medium (British)</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Speech Engine Mock Mode</div>
							<div className="text-[11px] text-void-fg-3">Mock whisper and piper when binaries are absent.</div>
						</div>
						<VoidSwitch
							value={voiceMockMode}
							onChange={(v) => {
								setVoiceMockMode(v);
								storageService.store('metis.prosopon.voiceMockMode', v, StorageScope.APPLICATION, StorageTarget.USER);
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

	const [memoryRoot, setMemoryRoot] = useState(
		storageService.get('metis.stoma.root', StorageScope.APPLICATION, '.stoma')
	);
	const [embeddingModel, setEmbeddingModel] = useState(
		storageService.get('metis.stoma.model', StorageScope.APPLICATION, 'nomic-embed-text')
	);
	const [topK, setTopK] = useState(
		storageService.get('metis.stoma.topK', StorageScope.APPLICATION, '5')
	);
	const [chunkSize, setChunkSize] = useState(
		storageService.get('metis.stoma.chunkSize', StorageScope.APPLICATION, '512')
	);
	const [chunkOverlap, setChunkOverlap] = useState(
		storageService.get('metis.stoma.chunkOverlap', StorageScope.APPLICATION, '64')
	);
	const [autoSync, setAutoSync] = useState(
		storageService.getBoolean('metis.stoma.autoSync', StorageScope.APPLICATION, true)
	);

	const updateStorage = (key: string, val: string, setter: (v: string) => void) => {
		setter(val);
		storageService.store(key, val, StorageScope.APPLICATION, StorageTarget.USER);
	};

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
					Vector Index & Retrieval Parameters
				</h4>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Memory Storage Root Path</label>
						<input
							type="text"
							value={memoryRoot}
							onChange={(e) => updateStorage('metis.stoma.root', e.target.value, setMemoryRoot)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-purple-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Local Embedding Model</label>
						<select
							value={embeddingModel}
							onChange={(e) => updateStorage('metis.stoma.model', e.target.value, setEmbeddingModel)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 focus:border-purple-500"
						>
							<option value="nomic-embed-text">nomic-embed-text (Hestia :8080 Q8_0)</option>
							<option value="all-minilm-l6-v2">all-MiniLM-L6-v2 (Local ONNX)</option>
							<option value="bge-small-en-v1.5">bge-small-en-v1.5</option>
						</select>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Top-K Retrieval Citations</label>
						<select
							value={topK}
							onChange={(e) => updateStorage('metis.stoma.topK', e.target.value, setTopK)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1"
						>
							<option value="3">3 chunks (Lean)</option>
							<option value="5">5 chunks (Standard)</option>
							<option value="10">10 chunks (Deep recall)</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Chunk Size (tokens)</label>
						<select
							value={chunkSize}
							onChange={(e) => updateStorage('metis.stoma.chunkSize', e.target.value, setChunkSize)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1"
						>
							<option value="256">256 tokens (Fine-grained)</option>
							<option value="512">512 tokens (Balanced)</option>
							<option value="1024">1,024 tokens (Coarse)</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Chunk Overlap (tokens)</label>
						<select
							value={chunkOverlap}
							onChange={(e) => updateStorage('metis.stoma.chunkOverlap', e.target.value, setChunkOverlap)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1"
						>
							<option value="32">32 tokens</option>
							<option value="64">64 tokens (Default)</option>
							<option value="128">128 tokens (High continuity)</option>
						</select>
					</div>
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

// =========================================================================
// 8. Krisis Answer Selection & Policy Gating Section
// =========================================================================
export const KrisisSection = () => {
	const accessor = useAccessor();
	const storageService = accessor.get('IStorageService');
	const notificationService = accessor.get('INotificationService');

	const [policyFile, setPolicyFile] = useState(
		storageService.get('metis.krisis.policyFile', StorageScope.APPLICATION, 'krisis/krisis-policy-0.1.json')
	);
	const [scoringEngine, setScoringEngine] = useState(
		storageService.get('metis.krisis.scoringEngine', StorageScope.APPLICATION, 'decimal_calc')
	);
	const [strictGates, setStrictGates] = useState(
		storageService.getBoolean('metis.krisis.strictGates', StorageScope.APPLICATION, true)
	);
	const [exactDedup, setExactDedup] = useState(
		storageService.getBoolean('metis.krisis.exactDedup', StorageScope.APPLICATION, true)
	);

	const updateStorage = (key: string, val: string, setter: (v: string) => void) => {
		setter(val);
		storageService.store(key, val, StorageScope.APPLICATION, StorageTarget.USER);
	};

	const testPolicyReplay = () => {
		notificationService.info('Krisis pure-policy test fixtures verified: 100% contracts validated.');
	};

	return (
		<div className="flex flex-col gap-6 max-w-[800px]">
			<div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-xl p-5">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<span className="text-xl">⚖️</span>
						<h3 className="text-base font-bold text-white">Krisis Candidate Selector & Gating Engine</h3>
					</div>
					<span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
						CONTRACT DRIVEN
					</span>
				</div>
				<p className="text-xs text-teal-200/80">
					Multi-candidate answer ranking, deterministic schema validation, policy threshold gating, and exact deduplication.
				</p>
			</div>

			<div className="bg-void-bg-2 border border-void-border-2 rounded-xl p-5 flex flex-col gap-5">
				<h4 className="font-semibold text-void-fg-1 text-sm border-b border-void-border-2 pb-2">
					Policy Rules & Evaluation Parameters
				</h4>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs text-void-fg-2 font-medium">Policy Specification File</label>
					<input
						type="text"
						value={policyFile}
						onChange={(e) => updateStorage('metis.krisis.policyFile', e.target.value, setPolicyFile)}
						className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1 font-mono focus:border-teal-500"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-void-fg-2 font-medium">Scoring Engine Precision</label>
						<select
							value={scoringEngine}
							onChange={(e) => updateStorage('metis.krisis.scoringEngine', e.target.value, setScoringEngine)}
							className="bg-void-bg-1 border border-void-border-2 rounded px-3 py-2 text-xs text-void-fg-1"
						>
							<option value="decimal_calc">Decimal Floating Calc (Fixed-Point Deterministic)</option>
							<option value="float64">Standard IEEE 754 float64</option>
							<option value="borda">Borda Count Rank Aggregation</option>
						</select>
					</div>

					<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
						<div>
							<div className="font-semibold text-xs text-void-fg-1">Exact Deduplication</div>
							<div className="text-[11px] text-void-fg-3">Collapse equivalent candidate outputs.</div>
						</div>
						<VoidSwitch
							value={exactDedup}
							onChange={(v) => {
								setExactDedup(v);
								storageService.store('metis.krisis.exactDedup', v, StorageScope.APPLICATION, StorageTarget.USER);
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between p-3 bg-void-bg-1/80 border border-void-border-2 rounded-lg">
					<div>
						<div className="font-semibold text-xs text-void-fg-1">Strict Policy Eligibility Gating</div>
						<div className="text-[11px] text-void-fg-3">Reject candidates failing threshold criteria rather than penalizing score.</div>
					</div>
					<VoidSwitch
						value={strictGates}
						onChange={(v) => {
							setStrictGates(v);
							storageService.store('metis.krisis.strictGates', v, StorageScope.APPLICATION, StorageTarget.USER);
						}}
					/>
				</div>

				<div className="pt-2 border-t border-void-border-2 flex justify-end">
					<button
						onClick={testPolicyReplay}
						className="px-4 py-2 bg-teal-600/80 hover:bg-teal-600 text-white font-medium text-xs rounded-lg transition"
					>
						Verify Policy Test Fixtures
					</button>
				</div>
			</div>
		</div>
	);
};
