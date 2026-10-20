/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import * as nls from '../../../../nls.js';
import { EditorExtensions } from '../../../common/editor.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorGroup, IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Dimension } from '../../../../base/browser/dom.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { Action2, MenuId, MenuRegistry, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { URI } from '../../../../base/common/uri.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Disposable, toDisposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { IStatusbarEntryAccessor, IStatusbarService, StatusbarAlignment } from '../../../services/statusbar/browser/statusbar.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { IQuickInputService, IQuickPickItem } from '../../../../platform/quickinput/common/quickInput.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';
import { METIS_DIANOIA_VIEW_ID, METIS_HESTIA_VIEW_ID, METIS_LOCHOS_VIEW_ID, METIS_PHYLAX_VIEW_ID, METIS_LAUNCHPAD_VIEW_ID, METIS_AGENT_HUB_VIEW_ID, METIS_RESEARCH_VIEW_ID, METIS_STOMA_VIEW_ID, METIS_DOKIME_VIEW_ID } from './metisViews.js';
import { VOID_VIEW_ID } from './sidebarPane.js';

import { mountMetisDashboard } from './react/out/void-settings-tsx/index.js';

export class MetisDashboardInput extends EditorInput {
	static readonly ID: string = 'workbench.input.metis.dashboard';

	static readonly RESOURCE = URI.from({
		scheme: 'void',
		path: 'dashboard'
	});

	readonly resource = MetisDashboardInput.RESOURCE;

	constructor() {
		super();
	}

	override get typeId(): string {
		return MetisDashboardInput.ID;
	}

	override getName(): string {
		return nls.localize('metisDashboardInputsName', 'Metis Sovereign Dashboard');
	}

	override getIcon() {
		return Codicon.dashboard;
	}

	override matches(other: unknown): boolean {
		return other instanceof MetisDashboardInput;
	}
}

export class MetisDashboardPane extends EditorPane {
	static readonly ID = 'workbench.editor.metisDashboardPane';

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super(MetisDashboardPane.ID, group, telemetryService, themeService, storageService);
	}

	protected createEditor(parent: HTMLElement): void {
		parent.style.height = '100%';
		parent.style.width = '100%';

		const dashboardElt = document.createElement('div');
		dashboardElt.style.height = '100%';
		dashboardElt.style.width = '100%';

		parent.appendChild(dashboardElt);

		this.instantiationService.invokeFunction(accessor => {
			const disposeFn = mountMetisDashboard(dashboardElt, accessor)?.dispose;
			this._register(toDisposable(() => disposeFn?.()));
		});
	}

	layout(dimension: Dimension): void {
		// layout updates
	}

	override get minimumWidth() { return 650; }
}

// Register Dashboard editor pane
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(MetisDashboardPane, MetisDashboardPane.ID, nls.localize('MetisDashboardPane', "Metis Sovereign Dashboard Pane")),
	[new SyncDescriptor(MetisDashboardInput)]
);

// Command: Open Dashboard
export const METIS_OPEN_DASHBOARD_ACTION_ID = 'workbench.action.openMetisDashboard';
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: METIS_OPEN_DASHBOARD_ACTION_ID,
			title: nls.localize2('metisDashboardAction', "Metis: Open Sovereign Dashboard / Launchpad"),
			f1: true,
			icon: Codicon.dashboard,
			menu: [
				{
					id: MenuId.LayoutControlMenuSubmenu,
					group: '0_metis',
					order: 1
				},
				{
					id: MenuId.LayoutControlMenu,
					when: ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both'),
					group: '0_metis',
					order: 1
				}
			]
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const instantiationService = accessor.get(IInstantiationService);

		// If already open, reveal it
		const openEditors = editorService.findEditors(MetisDashboardInput.RESOURCE);
		if (openEditors.length > 0) {
			await editorService.openEditor(openEditors[0].editor);
			return;
		}

		// Open dashboard editor
		const input = instantiationService.createInstance(MetisDashboardInput);
		await editorService.openEditor(input);
	}
});

// Command: Toggle Dashboard
export const METIS_TOGGLE_DASHBOARD_ACTION_ID = 'workbench.action.toggleMetisDashboard';
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: METIS_TOGGLE_DASHBOARD_ACTION_ID,
			title: nls.localize2('metisToggleDashboardAction', "Metis: Toggle Sovereign Dashboard"),
			icon: Codicon.folderActive,
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const editorGroupService = accessor.get(IEditorGroupsService);
		const instantiationService = accessor.get(IInstantiationService);

		const openEditors = editorService.findEditors(MetisDashboardInput.RESOURCE);
		if (openEditors.length !== 0) {
			const openEditor = openEditors[0].editor;
			const isCurrentlyOpen = editorService.activeEditor?.resource?.fsPath === openEditor.resource?.fsPath;
			if (isCurrentlyOpen) {
				await editorService.closeEditors(openEditors);
			} else {
				await editorGroupService.activeGroup.openEditor(openEditor);
			}
			return;
		}

		const input = instantiationService.createInstance(MetisDashboardInput);
		await editorGroupService.activeGroup.openEditor(input);
	}
});

// Command: Sovereign Quick Menu
export const METIS_QUICK_MENU_ACTION_ID = 'workbench.action.metis.quickMenu';
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: METIS_QUICK_MENU_ACTION_ID,
			title: nls.localize2('metisQuickMenuAction', "Metis: Sovereign Quick Actions"),
			f1: true,
			icon: Codicon.circuitBoard,
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const quickInputService = accessor.get(IQuickInputService);
		const viewsService = accessor.get(IViewsService);
		const editorService = accessor.get(IEditorService);
		const instantiationService = accessor.get(IInstantiationService);
		const storageService = accessor.get(IStorageService);
		const voidSettingsService = accessor.get(IVoidSettingsService);
		const notificationService = accessor.get(INotificationService);

		const voiceStored = storageService.get('metis.prosopon.voiceEnabled', StorageScope.APPLICATION);
		const voiceEnabled = voiceStored === 'true';

		interface IMetisQuickItem extends IQuickPickItem {
			id: string;
		}

		const items: IMetisQuickItem[] = [
			{
				id: 'dashboard',
				label: '$(dashboard) Open Sovereign Mission Control',
				description: 'Full-screen system telemetry, service states & logs',
			},
			{
				id: 'launchpad',
				label: '$(rocket) Open Command Launchpad',
				description: 'One-click launch deck, hardware stats, and model controls',
			},
			{
				id: 'agent_hub',
				label: '$(hubot) Open Autonomous Agent & Coding Hub',
				description: 'Lochos squad seats, worktree batons, and durable task queue',
			},
			{
				id: 'research',
				label: '$(beaker) Open Research & Reasoning Hub',
				description: 'Dianoia epistemic deliberation, belief trees, and dialectic traces',
			},
			{
				id: 'stoma',
				label: '$(database) Open Stoma Memory & Ingestion',
				description: 'Generational memory ledger (.stoma/), AST symbols, and context flushing',
			},
			{
				id: 'dokime',
				label: '$(check-all) Open Dokime Zero-Trust Verification',
				description: 'Statistical validation (1,003 unit & integration tests) and safety benchmarks',
			},
			{
				id: 'switch_model',
				label: '$(server-process) Switch Active Chat Model...',
				description: 'Inspect loaded & available local models in Hestia',
			},
			{
				id: 'toggle_voice',
				label: `$(mic) Toggle Voice Engine (Whisper & Piper)`,
				description: voiceEnabled ? 'Currently ENABLED • Click to turn OFF' : 'Currently OFF (Default) • Click to turn ON',
			},
			{
				id: 'phylax',
				label: '$(shield) Open Phylax Security Guard',
				description: 'Action token governance, capability gates & audits',
			},
			{
				id: 'chat',
				label: '$(comment-discussion) Open Sovereign AI Chat',
				description: 'Interactive chat with active local model',
			},
		];

		const picked = await quickInputService.pick(items, {
			placeHolder: 'Select a Metis Sovereign Stack Action or View',
		});

		if (!picked) {
			return;
		}

		switch (picked.id) {
			case 'dashboard': {
				const openEditors = editorService.findEditors(MetisDashboardInput.RESOURCE);
				if (openEditors.length > 0) {
					await editorService.openEditor(openEditors[0].editor);
				} else {
					const input = instantiationService.createInstance(MetisDashboardInput);
					await editorService.openEditor(input);
				}
				break;
			}
			case 'launchpad':
				await viewsService.openView(METIS_LAUNCHPAD_VIEW_ID, true);
				break;
			case 'agent_hub':
				await viewsService.openView(METIS_AGENT_HUB_VIEW_ID, true);
				break;
			case 'research':
				await viewsService.openView(METIS_RESEARCH_VIEW_ID, true);
				break;
			case 'stoma':
				await viewsService.openView(METIS_STOMA_VIEW_ID, true);
				break;
			case 'dokime':
				await viewsService.openView(METIS_DOKIME_VIEW_ID, true);
				break;
			case 'phylax':
				await viewsService.openView(METIS_PHYLAX_VIEW_ID, true);
				break;
			case 'lochos':
				await viewsService.openView(METIS_LOCHOS_VIEW_ID, true);
				break;
			case 'hestia':
				await viewsService.openView(METIS_HESTIA_VIEW_ID, true);
				break;
			case 'dianoia':
				await viewsService.openView(METIS_DIANOIA_VIEW_ID, true);
				break;
			case 'chat':
				await viewsService.openView(VOID_VIEW_ID, true);
				break;
			case 'toggle_voice': {
				const nextState = !voiceEnabled;
				storageService.store('metis.prosopon.voiceEnabled', nextState, StorageScope.APPLICATION, StorageTarget.USER);
				notificationService.info(
					nextState
						? '🎙️ Voice Models (Whisper STT / Piper TTS) are now ENABLED.'
						: '🔇 Voice Models are now turned OFF (Default).'
				);
				break;
			}
			case 'switch_model': {
				try {
					const res = await fetch('http://127.0.0.1:8080/models', { signal: AbortSignal.timeout(3000) });
					if (!res.ok) {
						throw new Error(`Hestia HTTP ${res.status}`);
					}
					const data = await res.json();
					const models: any[] = data.models || [];
					if (models.length === 0) {
						notificationService.warn('No models configured in Hestia.');
						return;
					}
					interface IModelPickItem extends IQuickPickItem {
						modelName: string;
					}
					const modelPicks: IModelPickItem[] = models.map((m: any) => ({
						label: `${m.state === 'loaded' ? '🟢' : '⚪'} ${m.name}`,
						description: `${m.type} • ~${Math.round((m.vram_estimate_mb || 0) / 1024 * 10) / 10}GB VRAM`,
						detail: m.state === 'loaded' ? 'Currently Loaded in GPU' : 'Available to load on demand',
						modelName: m.name
					}));
					const selected = await quickInputService.pick(modelPicks, {
						placeHolder: 'Select a Sovereign model for Void Chat'
					});
					if (selected) {
						await voidSettingsService.setModelSelectionOfFeature('Chat', {
							providerName: 'metis',
							modelName: selected.modelName
						});
						notificationService.info(`Metis Chat Model switched to "${selected.modelName}".`);
					}
				} catch (err: any) {
					notificationService.error(`Could not query Hestia models: ${err?.message || err}`);
				}
				break;
			}
		}
	}
});

// Startup Contribution: Open Dashboard on Startup, Live Telemetry Status Bar & Background Attention Polling
export class MetisDashboardStartupContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.metisDashboardStartup';

	private _statusbarEntry: IStatusbarEntryAccessor | undefined;
	private _pollInterval: any = null;
	private readonly _promptedAttentionEventIds = new Set<string>();

	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@IStatusbarService private readonly statusbarService: IStatusbarService,
		@INotificationService private readonly notificationService: INotificationService,
		@IViewsService private readonly viewsService: IViewsService,
		@IStorageService private readonly storageService: IStorageService
	) {
		super();
		this.init();
	}

	override dispose(): void {
		if (this._pollInterval) {
			clearInterval(this._pollInterval);
			this._pollInterval = null;
		}
		this._statusbarEntry?.dispose();
		super.dispose();
	}

	private async init(): Promise<void> {
		this._statusbarEntry = this.statusbarService.addEntry(
			{
				name: nls.localize('metisStatusbar', "Metis Sovereign Stack"),
				text: `$(circuit-board) Metis`,
				tooltip: nls.localize('metisStatusbarTooltip', "Metis Sovereign Stack • Click for Sovereign Menu"),
				ariaLabel: nls.localize('metisStatusbarAria', "Metis Sovereign Stack"),
				command: METIS_QUICK_MENU_ACTION_ID
			},
			'metis.dashboard.status',
			StatusbarAlignment.LEFT,
			1000
		);

		await this.lifecycleService.when(LifecyclePhase.Restored);

		// Always ensure the Metis Sovereign Dashboard is opened on startup
		const openEditors = this.editorService.findEditors(MetisDashboardInput.RESOURCE);
		if (openEditors.length === 0) {
			const input = this.instantiationService.createInstance(MetisDashboardInput);
			await this.editorService.openEditor(input, { pinned: false });
		}

		// Initial telemetry and attention check
		this._pollTelemetry();

		// Background polling every 3.5 seconds
		this._pollInterval = setInterval(() => {
			this._pollTelemetry();
		}, 3500);
	}

	private async _pollTelemetry(): Promise<void> {
		let hestiaOnline = false;
		let loadedModel: string | null = null;
		let vramUsedGb = 0;
		let vramTotalGb = 0;

		// 1. Poll Hestia health
		try {
			const res = await fetch('http://127.0.0.1:8080/health', { signal: AbortSignal.timeout(2000) });
			if (res.ok) {
				const data = await res.json();
				hestiaOnline = true;
				if (data.models && Array.isArray(data.models)) {
					const loaded = data.models.find((m: any) => m.state === 'loaded');
					if (loaded) {
						loadedModel = loaded.name;
					}
				}
				if (data.gpu) {
					const total = data.gpu.vram_total_mb || 0;
					const free = data.gpu.vram_free_mb || 0;
					vramUsedGb = Math.round(((total - free) / 1024) * 10) / 10;
					vramTotalGb = Math.round((total / 1024) * 10) / 10;
				}
			}
		} catch {
			// Hestia offline or restarting
		}

		// Voice engine state
		const voiceStored = this.storageService.get('metis.prosopon.voiceEnabled', StorageScope.APPLICATION);
		const voiceEnabled = voiceStored === 'true';

		// Update Status Bar
		if (this._statusbarEntry) {
			if (hestiaOnline) {
				const shortModel = loadedModel ? (loadedModel.length > 18 ? loadedModel.substring(0, 15) + '…' : loadedModel) : null;
				const text = shortModel
					? `$(hubot) ${shortModel} • $(circuit-board) ${vramUsedGb}GB`
					: `$(hubot) Metis Ready • $(circuit-board) ${vramUsedGb}/${vramTotalGb}GB`;

				const tooltip = [
					`**Metis Sovereign Stack** (Online)`,
					`• **Engine**: Hestia (Local GPU)`,
					`• **Active Model**: ${loadedModel || 'None (loads on demand)'}`,
					`• **VRAM**: ${vramUsedGb} GB / ${vramTotalGb} GB`,
					`• **Voice Pipeline**: ${voiceEnabled ? '🟢 Enabled' : '⚪ Disabled (Default)'}`,
					`\n*Click to open Sovereign Quick Actions*`
				].join('\n\n');

				this._statusbarEntry.update({
					name: nls.localize('metisStatusbar', "Metis Sovereign Stack"),
					text,
					tooltip,
					ariaLabel: text,
					command: METIS_QUICK_MENU_ACTION_ID
				});
			} else {
				this._statusbarEntry.update({
					name: nls.localize('metisStatusbar', "Metis Sovereign Stack"),
					text: `$(circle-outline) Metis Offline`,
					tooltip: `Metis Sovereign Stack is offline.\nClick to view quick actions.`,
					ariaLabel: `Metis Offline`,
					command: METIS_QUICK_MENU_ACTION_ID
				});
			}
		}

		// 2. Poll Kybernetes Attention
		try {
			const attRes = await fetch('http://127.0.0.1:8081/v1/lochos/attention', {
				headers: { 'Authorization': 'Bearer metis-sovereign' },
				signal: AbortSignal.timeout(2000)
			});
			if (attRes.ok) {
				const events = await attRes.json();
				if (Array.isArray(events)) {
					for (const ev of events) {
						const eventKey = `${ev.event_id || ev.task_id}_${ev.seat_id}`;
						if (!this._promptedAttentionEventIds.has(eventKey)) {
							this._promptedAttentionEventIds.add(eventKey);
							this._showAttentionPrompt(ev);
						}
					}
				}
			}
		} catch {
			// Kybernetes offline or no attention
		}
	}

	private _showAttentionPrompt(ev: any): void {
		const seatId = ev.seat_id || 'Agent';
		const taskId = ev.task_id || 'unknown';
		const reason = ev.reason || 'Authorization required';
		const title = ev.title ? ` ("${ev.title}")` : '';

		this.notificationService.prompt(
			Severity.Warning,
			`🛡️ Phylax Approval: ${seatId} needs authorization for "${reason}" on task #${taskId}${title}`,
			[
				{
					label: '⚡ Approve & Run',
					run: async () => {
						try {
							await fetch('http://127.0.0.1:8081/v1/lochos/attention/resolve', {
								method: 'POST',
								headers: {
									'Authorization': 'Bearer metis-sovereign',
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({ task_id: taskId, seat_id: seatId, resolution: 'approved' })
							});
							this.notificationService.info(`Phylax: Action for task #${taskId} approved.`);
						} catch (err: any) {
							this.notificationService.error(`Failed to approve: ${err?.message || err}`);
						}
					}
				},
				{
					label: '❌ Reject',
					run: async () => {
						try {
							await fetch('http://127.0.0.1:8081/v1/lochos/attention/resolve', {
								method: 'POST',
								headers: {
									'Authorization': 'Bearer metis-sovereign',
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({ task_id: taskId, seat_id: seatId, resolution: 'rejected' })
							});
							this.notificationService.info(`Phylax: Action for task #${taskId} rejected.`);
						} catch (err: any) {
							this.notificationService.error(`Failed to reject: ${err?.message || err}`);
						}
					}
				},
				{
					label: '🔍 Inspect in Squad',
					run: () => {
						this.viewsService.openView(METIS_LOCHOS_VIEW_ID, true);
					}
				}
			],
			{ sticky: true }
		);
	}
}

registerWorkbenchContribution2(
	MetisDashboardStartupContribution.ID,
	MetisDashboardStartupContribution,
	WorkbenchPhase.AfterRestored
);

// Append to Global Activity menu
MenuRegistry.appendMenuItem(MenuId.GlobalActivity, {
	group: '0_command',
	command: {
		id: METIS_OPEN_DASHBOARD_ACTION_ID,
		title: nls.localize('metisDashboardActionGlobal', "Metis Sovereign Dashboard")
	},
	order: 0
});

