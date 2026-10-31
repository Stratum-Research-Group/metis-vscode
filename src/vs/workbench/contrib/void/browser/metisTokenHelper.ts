/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';

export const METIS_STORAGE_KYBERNETES_TOKEN_KEY = 'metis.kybernetes.serviceToken';
export const METIS_STORAGE_HESTIA_TOKEN_KEY = 'metis.hestia.serviceToken';
export const METIS_STORAGE_ADMIN_TOKEN_KEY = 'metis.kybernetes.adminToken';

// In-memory cache for fast synchronous access
let _cachedKybernetesToken: string | null = null;
let _cachedHestiaToken: string | null = null;

/**
 * Parse an environment file (e.g. deploy/metis.env) for key-value pairs.
 */
export function parseEnvFile(content: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const rawLine of content.split('\n')) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#') || !line.includes('=')) {
			continue;
		}
		const eqIdx = line.indexOf('=');
		const key = line.substring(0, eqIdx).trim();
		let val = line.substring(eqIdx + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.substring(1, val.length - 1);
		}
		if (key && val) {
			result[key] = val;
		}
	}
	return result;
}

/**
 * Asynchronously discover and resolve Metis service tokens from deploy/metis.env or storage.
 * Automatically synchronizes with IStorageService and IVoidSettingsService.
 */
export async function resolveMetisTokensAsync(
	fileService?: IFileService,
	workspaceContextService?: IWorkspaceContextService,
	storageService?: IStorageService,
	voidSettingsService?: IVoidSettingsService
): Promise<{ kybernetesToken: string; hestiaToken: string }> {
	let kybToken: string | null = null;
	let hestiaToken: string | null = null;

	// 1. Check storageService
	if (storageService) {
		const storedKyb = storageService.get(METIS_STORAGE_KYBERNETES_TOKEN_KEY, StorageScope.APPLICATION);
		if (storedKyb && storedKyb !== 'metis-sovereign' && storedKyb !== 'metis-local-service-token') {
			kybToken = storedKyb;
		}
		const storedHestia = storageService.get(METIS_STORAGE_HESTIA_TOKEN_KEY, StorageScope.APPLICATION);
		if (storedHestia && storedHestia !== 'metis-sovereign') {
			hestiaToken = storedHestia;
		}
	}

	// 2. Check voidSettingsService provider settings for Metis apiKey
	if (!kybToken && voidSettingsService) {
		const metisApiKey = voidSettingsService.state?.settingsOfProvider?.metis?.apiKey;
		if (metisApiKey && metisApiKey !== 'metis-sovereign') {
			kybToken = metisApiKey;
		}
	}

	// 3. Auto-discover from workspace deploy/metis.env
	if ((!kybToken || !hestiaToken) && fileService && workspaceContextService) {
		const folders = workspaceContextService.getWorkspace().folders;
		for (const folder of folders) {
			const candidateUri = URI.joinPath(folder.uri, 'deploy', 'metis.env');
			try {
				const fileContent = await fileService.readFile(candidateUri);
				const parsed = parseEnvFile(fileContent.value.toString());
				if (parsed['KYBERNETES_SERVICE_TOKEN'] && !kybToken) {
					kybToken = parsed['KYBERNETES_SERVICE_TOKEN'];
				}
				if (parsed['HESTIA_SERVICE_TOKEN'] && !hestiaToken) {
					hestiaToken = parsed['HESTIA_SERVICE_TOKEN'];
				}
				if (kybToken && hestiaToken) break;
			} catch {
				// file not present in this folder, check next
			}
		}
	}

	// 4. Fallback defaults if discovery found nothing
	kybToken = kybToken || '0d4b83563dfab46fdec0d777728985eb1fd0bd0ba4c4a2b0';
	hestiaToken = hestiaToken || '0d4b83563dfab46fdec0d777728985eb1fd0bd0ba4c4a2b0';

	// Cache in memory
	_cachedKybernetesToken = kybToken;
	_cachedHestiaToken = hestiaToken;

	// Persist to storageService for subsequent fast lookups
	if (storageService) {
		storageService.store(METIS_STORAGE_KYBERNETES_TOKEN_KEY, kybToken, StorageScope.APPLICATION, StorageTarget.USER);
		storageService.store(METIS_STORAGE_HESTIA_TOKEN_KEY, hestiaToken, StorageScope.APPLICATION, StorageTarget.USER);
	}

	// Keep voidSettingsService in sync
	if (voidSettingsService && voidSettingsService.state?.settingsOfProvider?.metis) {
		const currentKey = voidSettingsService.state.settingsOfProvider.metis.apiKey;
		if (!currentKey || currentKey === 'metis-sovereign') {
			try {
				voidSettingsService.setSettingOfProvider('metis', 'apiKey', kybToken);
			} catch {
				// best effort
			}
		}
	}

	return { kybernetesToken: kybToken, hestiaToken };
}

/**
 * Synchronous resolver for Kybernetes Bearer service token.
 */
export function getMetisKybernetesToken(
	storageService?: IStorageService,
	voidSettingsService?: IVoidSettingsService
): string {
	if (_cachedKybernetesToken) {
		return _cachedKybernetesToken;
	}
	if (storageService) {
		const val = storageService.get(METIS_STORAGE_KYBERNETES_TOKEN_KEY, StorageScope.APPLICATION);
		if (val && val !== 'metis-sovereign' && val !== 'metis-local-service-token') {
			_cachedKybernetesToken = val;
			return val;
		}
	}
	if (voidSettingsService) {
		const val = voidSettingsService.state?.settingsOfProvider?.metis?.apiKey;
		if (val && val !== 'metis-sovereign') {
			_cachedKybernetesToken = val;
			return val;
		}
	}
	return '0d4b83563dfab46fdec0d777728985eb1fd0bd0ba4c4a2b0';
}

/**
 * Synchronous resolver for Hestia Bearer service token.
 */
export function getMetisHestiaToken(
	storageService?: IStorageService
): string {
	if (_cachedHestiaToken) {
		return _cachedHestiaToken;
	}
	if (storageService) {
		const val = storageService.get(METIS_STORAGE_HESTIA_TOKEN_KEY, StorageScope.APPLICATION);
		if (val && val !== 'metis-sovereign') {
			_cachedHestiaToken = val;
			return val;
		}
	}
	return '0d4b83563dfab46fdec0d777728985eb1fd0bd0ba4c4a2b0';
}

/**
 * Return authorization headers dictionary for Kybernetes HTTP calls.
 */
export function getMetisAuthHeaders(
	storageService?: IStorageService,
	voidSettingsService?: IVoidSettingsService
): Record<string, string> {
	const token = getMetisKybernetesToken(storageService, voidSettingsService);
	return {
		'Authorization': `Bearer ${token}`
	};
}

