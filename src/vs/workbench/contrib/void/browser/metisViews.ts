/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import {
	Extensions as ViewContainerExtensions, IViewContainersRegistry,
	ViewContainerLocation, IViewsRegistry, Extensions as ViewExtensions,
	IViewDescriptorService,
} from '../../../common/views.js';
import * as nls from '../../../../nls.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Orientation } from '../../../../base/browser/ui/sash/sash.js';

// =========================================================================
// 1. Phylax View (Security & Action Token Governance)
// =========================================================================

export class PhylaxViewPane extends ViewPane {
	constructor(
		options: IViewPaneOptions,
		@IInstantiationService instantiationService: IInstantiationService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IOpenerService openerService: IOpenerService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IHoverService hoverService: IHoverService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(parent: HTMLElement): void {
		super.renderBody(parent);
		parent.style.userSelect = 'text';
		parent.style.padding = '14px';
		parent.style.fontFamily = 'var(--vscode-font-family)';
		parent.style.fontSize = '12px';
		parent.style.color = 'var(--vscode-foreground)';
		parent.style.display = 'flex';
		parent.style.flexDirection = 'column';
		parent.style.gap = '12px';
		parent.style.overflowY = 'auto';

		parent.innerHTML = `
			<div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 12px;">
				<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
					<span style="font-weight: 600; font-size: 13px; color: #f8fafc;">🛡️ Phylax Policy Guard</span>
					<span style="background: #10b98122; color: #10b981; border: 1px solid #10b98144; border-radius: 9999px; font-size: 10px; padding: 2px 8px; font-weight: 600;">ENFORCING</span>
				</div>
				<p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
					Cryptographic single-use action tokens protect the workspace. Code mutations & terminal executions require affirmative local approvals.
				</p>
			</div>

			<div style="background: var(--vscode-sideBar-background); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
				<div style="font-weight: 600; color: #e2e8f0; margin-bottom: 8px; font-size: 12px;">Active Policy Matrix</div>
				<div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
					<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
						<span style="color: #94a3b8;">read_file_range</span>
						<span style="color: #10b981; font-weight: 500;">AUTO_ALLOW</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
						<span style="color: #94a3b8;">edit_file_block</span>
						<span style="color: #f59e0b; font-weight: 500;">TOKEN_GATED</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
						<span style="color: #94a3b8;">write_file</span>
						<span style="color: #f59e0b; font-weight: 500;">TOKEN_GATED</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 4px 0;">
						<span style="color: #94a3b8;">sandboxed_bash</span>
						<span style="color: #ef4444; font-weight: 500;">ISOLATED_GATED</span>
					</div>
				</div>
			</div>

			<div style="background: var(--vscode-sideBar-background); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
				<div style="font-weight: 600; color: #e2e8f0; margin-bottom: 6px; font-size: 12px;">Pending Action Tokens</div>
				<div style="color: #64748b; font-size: 11px; font-style: italic; padding: 6px 0;">
					No unapproved tool tokens pending. Tokens auto-expire in 300 seconds.
				</div>
			</div>
		`;
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		this.element.style.height = `${height}px`;
		this.element.style.width = `${width}px`;
	}
}

export const METIS_PHYLAX_CONTAINER_ID = 'workbench.view.metis.phylax';
export const METIS_PHYLAX_VIEW_ID = 'workbench.view.metis.phylax.pane';

// =========================================================================
// 2. Dianoia View (Deliberation Graph & Checkpoints)
// =========================================================================

export class DianoiaViewPane extends ViewPane {
	constructor(
		options: IViewPaneOptions,
		@IInstantiationService instantiationService: IInstantiationService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IOpenerService openerService: IOpenerService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IHoverService hoverService: IHoverService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(parent: HTMLElement): void {
		super.renderBody(parent);
		parent.style.userSelect = 'text';
		parent.style.padding = '14px';
		parent.style.fontFamily = 'var(--vscode-font-family)';
		parent.style.fontSize = '12px';
		parent.style.color = 'var(--vscode-foreground)';
		parent.style.display = 'flex';
		parent.style.flexDirection = 'column';
		parent.style.gap = '12px';
		parent.style.overflowY = 'auto';

		parent.innerHTML = `
			<div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 8px; padding: 12px;">
				<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
					<span style="font-weight: 600; font-size: 13px; color: #f8fafc;">🧠 Dianoia Graph</span>
					<span style="background: #06b6d422; color: #06b6d4; border: 1px solid #06b6d444; border-radius: 9999px; font-size: 10px; padding: 2px 8px; font-weight: 600;">ACTIVE</span>
				</div>
				<p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
					Deliberative reasoning trajectory, hypothesis branching, and Odyssey milestone checkpoint history.
				</p>
			</div>

			<div style="background: var(--vscode-sideBar-background); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
				<div style="font-weight: 600; color: #e2e8f0; margin-bottom: 8px; font-size: 12px;">Odyssey Checkpoints</div>
				<div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
					<div style="padding: 8px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border-left: 3px solid #6366f1;">
						<div style="display: flex; justify-content: space-between; font-weight: 500; color: #f1f5f9;">
							<span>refs/odyssey/checkpoint_0</span>
							<span style="color: #10b981;">PASSED</span>
						</div>
						<div style="color: #64748b; font-size: 10px; margin-top: 3px;">Milestone baseline prior to agent mutation</div>
					</div>
				</div>
			</div>

			<div style="background: var(--vscode-sideBar-background); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
				<div style="font-weight: 600; color: #e2e8f0; margin-bottom: 6px; font-size: 12px;">Hermes Learned Skills</div>
				<div style="color: #94a3b8; font-size: 11px;">
					Skills directory: <code style="background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 4px;">.metis/skills/</code>
				</div>
			</div>
		`;
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		this.element.style.height = `${height}px`;
		this.element.style.width = `${width}px`;
	}
}

export const METIS_DIANOIA_CONTAINER_ID = 'workbench.view.metis.dianoia';
export const METIS_DIANOIA_VIEW_ID = 'workbench.view.metis.dianoia.pane';

// =========================================================================
// 3. Hestia View (Local Model & VRAM Monitor)
// =========================================================================

export class HestiaViewPane extends ViewPane {
	constructor(
		options: IViewPaneOptions,
		@IInstantiationService instantiationService: IInstantiationService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IOpenerService openerService: IOpenerService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IHoverService hoverService: IHoverService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(parent: HTMLElement): void {
		super.renderBody(parent);
		parent.style.userSelect = 'text';
		parent.style.padding = '14px';
		parent.style.fontFamily = 'var(--vscode-font-family)';
		parent.style.fontSize = '12px';
		parent.style.color = 'var(--vscode-foreground)';
		parent.style.display = 'flex';
		parent.style.flexDirection = 'column';
		parent.style.gap = '12px';
		parent.style.overflowY = 'auto';

		parent.innerHTML = `
			<div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 8px; padding: 12px;">
				<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
					<span style="font-weight: 600; font-size: 13px; color: #f8fafc;">🏛️ Hestia Local Engine</span>
					<span style="background: #a855f722; color: #c084fc; border: 1px solid #c084fc44; border-radius: 9999px; font-size: 10px; padding: 2px 8px; font-weight: 600;">PORT 8080</span>
				</div>
				<p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
					OpenAI-compatible inference server running 100% on local hardware. Zero telemetry, zero cloud egress.
				</p>
			</div>

			<div style="background: var(--vscode-sideBar-background); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px;">
				<div style="font-weight: 600; color: #e2e8f0; margin-bottom: 8px; font-size: 12px;">Sovereign Model Stack</div>
				<div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
					<div style="padding: 6px; background: rgba(255, 255, 255, 0.02); border-radius: 6px;">
						<div style="font-weight: 500; color: #f1f5f9;">Qwen2.5-Coder-32B-Instruct</div>
						<div style="color: #64748b; font-size: 10px;">Primary Autonomous Coding Engine</div>
					</div>
					<div style="padding: 6px; background: rgba(255, 255, 255, 0.02); border-radius: 6px;">
						<div style="font-weight: 500; color: #f1f5f9;">Qwen2.5-Coder-14B-Instruct</div>
						<div style="color: #64748b; font-size: 10px;">Fast Local Fill-In-the-Middle (FIM)</div>
					</div>
				</div>
			</div>
		`;
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		this.element.style.height = `${height}px`;
		this.element.style.width = `${width}px`;
	}
}

export const METIS_HESTIA_CONTAINER_ID = 'workbench.view.metis.hestia';
export const METIS_HESTIA_VIEW_ID = 'workbench.view.metis.hestia.pane';

// =========================================================================
// Register View Containers & Views in Activity Bar
// =========================================================================

const viewContainerRegistry = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry);
const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);

// 1. Phylax View Container & Pane
const phylaxContainer = viewContainerRegistry.registerViewContainer({
	id: METIS_PHYLAX_CONTAINER_ID,
	title: nls.localize2('metisPhylaxTitle', 'Phylax Security'),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [METIS_PHYLAX_CONTAINER_ID, {
		mergeViewWithContainerWhenSingleView: true,
		orientation: Orientation.HORIZONTAL,
	}]),
	hideIfEmpty: false,
	order: 10,
	rejectAddedViews: true,
	icon: Codicon.shield,
}, ViewContainerLocation.Sidebar, { doNotRegisterOpenCommand: false });

viewsRegistry.registerViews([{
	id: METIS_PHYLAX_VIEW_ID,
	hideByDefault: false,
	name: nls.localize2('metisPhylaxView', 'Phylax Guard'),
	ctorDescriptor: new SyncDescriptor(PhylaxViewPane),
	canToggleVisibility: false,
	canMoveView: false,
	weight: 100,
	order: 1,
}], phylaxContainer);

// 2. Dianoia View Container & Pane
const dianoiaContainer = viewContainerRegistry.registerViewContainer({
	id: METIS_DIANOIA_CONTAINER_ID,
	title: nls.localize2('metisDianoiaTitle', 'Dianoia Deliberation'),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [METIS_DIANOIA_CONTAINER_ID, {
		mergeViewWithContainerWhenSingleView: true,
		orientation: Orientation.HORIZONTAL,
	}]),
	hideIfEmpty: false,
	order: 11,
	rejectAddedViews: true,
	icon: Codicon.gitBranch,
}, ViewContainerLocation.Sidebar, { doNotRegisterOpenCommand: false });

viewsRegistry.registerViews([{
	id: METIS_DIANOIA_VIEW_ID,
	hideByDefault: false,
	name: nls.localize2('metisDianoiaView', 'Deliberation Graph'),
	ctorDescriptor: new SyncDescriptor(DianoiaViewPane),
	canToggleVisibility: false,
	canMoveView: false,
	weight: 100,
	order: 1,
}], dianoiaContainer);

// 3. Hestia View Container & Pane
const hestiaContainer = viewContainerRegistry.registerViewContainer({
	id: METIS_HESTIA_CONTAINER_ID,
	title: nls.localize2('metisHestiaTitle', 'Hestia Models'),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [METIS_HESTIA_CONTAINER_ID, {
		mergeViewWithContainerWhenSingleView: true,
		orientation: Orientation.HORIZONTAL,
	}]),
	hideIfEmpty: false,
	order: 12,
	rejectAddedViews: true,
	icon: Codicon.database,
}, ViewContainerLocation.Sidebar, { doNotRegisterOpenCommand: false });

viewsRegistry.registerViews([{
	id: METIS_HESTIA_VIEW_ID,
	hideByDefault: false,
	name: nls.localize2('metisHestiaView', 'Local Models'),
	ctorDescriptor: new SyncDescriptor(HestiaViewPane),
	canToggleVisibility: false,
	canMoveView: false,
	weight: 100,
	order: 1,
}], hestiaContainer);
