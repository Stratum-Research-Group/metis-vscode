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
import { IStorageService } from '../../../../platform/storage/common/storage.js';
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
import { IWorkspaceContextService, WorkbenchState } from '../../../../platform/workspace/common/workspace.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';

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
		return Codicon.folderActive;
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
			icon: Codicon.folderActive,
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

// Startup Contribution: Open Dashboard on Empty Workbench
export class MetisDashboardStartupContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.metisDashboardStartup';

	constructor(
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@IEditorService private readonly editorService: IEditorService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService
	) {
		super();
		this.init();
	}

	private async init(): Promise<void> {
		await this.lifecycleService.when(LifecyclePhase.Restored);

		// When workbench is empty, show the Metis Sovereign Dashboard
		if (this.contextService.getWorkbenchState() === WorkbenchState.EMPTY) {
			const openEditors = this.editorService.findEditors(MetisDashboardInput.RESOURCE);
			if (openEditors.length === 0 && this.editorService.editors.length === 0) {
				const input = this.instantiationService.createInstance(MetisDashboardInput);
				await this.editorService.openEditor(input, { pinned: false });
			}
		}
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
