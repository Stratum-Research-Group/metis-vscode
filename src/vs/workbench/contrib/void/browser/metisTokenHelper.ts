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
export const METIS_STORAGE_PROSOPON_TOKEN_KEY = 'metis.prosopon.hostOwnerToken';

// In-memory cache for fast synchronous access
let _cachedKybernetesToken: string | null = null;
let _cachedHestiaToken: string | null = null;
let _cachedProsoponToken: string | null = null;

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
): Promise<{ kybernetesToken: string; hestiaToken: string; prosoponToken: string }> {
	let kybToken: string | null = null;
	let hestiaToken: string | null = null;
	let prosoponToken: string | null = null;

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
		const storedPros = storageService.get(METIS_STORAGE_PROSOPON_TOKEN_KEY, StorageScope.APPLICATION);
		if (storedPros && storedPros !== 'metis-sovereign') {
			prosoponToken = storedPros;
		}
	}

	// 2. Check voidSettingsService provider settings for Metis apiKey
	if (!kybToken && voidSettingsService) {
		const metisApiKey = voidSettingsService.state?.settingsOfProvider?.metis?.apiKey;
		if (metisApiKey && metisApiKey !== 'metis-sovereign') {
			kybToken = metisApiKey;
		}
	}

	// 3. Auto-discover from workspace deploy/metis.env and data/.host_owner_token
	if ((!kybToken || !hestiaToken || !prosoponToken) && fileService && workspaceContextService) {
		const folders = workspaceContextService.getWorkspace().folders;
		for (const folder of folders) {
			const envUri = URI.joinPath(folder.uri, 'deploy', 'metis.env');
			try {
				const fileContent = await fileService.readFile(envUri);
				const parsed = parseEnvFile(fileContent.value.toString());
				if (parsed['KYBERNETES_SERVICE_TOKEN'] && !kybToken) {
					kybToken = parsed['KYBERNETES_SERVICE_TOKEN'];
				}
				if (parsed['HESTIA_SERVICE_TOKEN'] && !hestiaToken) {
					hestiaToken = parsed['HESTIA_SERVICE_TOKEN'];
				}
				if ((parsed['PROSOPON_HOST_OWNER_TOKEN'] || parsed['PROSOPON_SERVICE_TOKEN']) && !prosoponToken) {
					prosoponToken = parsed['PROSOPON_HOST_OWNER_TOKEN'] || parsed['PROSOPON_SERVICE_TOKEN'];
				}
			} catch {
				// file not present in this folder, check next
			}

			if (!prosoponToken) {
				const hostOwnerUri = URI.joinPath(folder.uri, 'data', '.host_owner_token');
				try {
					const hostOwnerContent = await fileService.readFile(hostOwnerUri);
					const tok = hostOwnerContent.value.toString().trim();
					if (tok) {
						prosoponToken = tok;
					}
				} catch {
					// file not present in this folder
				}
			}

			if (kybToken && hestiaToken && prosoponToken) break;
		}
	}

	// 4. Fallback defaults if discovery found nothing
	kybToken = kybToken || '0d4b83563dfab46fdec0d777728985eb1fd0bd0ba4c4a2b0';
	hestiaToken = hestiaToken || '0d4b83563dfab46fdec0d777728985eb1fd0bd0ba4c4a2b0';
	prosoponToken = prosoponToken || '3y-LilvWapsZAVRUOpZCGNZ4L4cE8grWm_7iQQC7PrE';

	// Cache in memory
	_cachedKybernetesToken = kybToken;
	_cachedHestiaToken = hestiaToken;
	_cachedProsoponToken = prosoponToken;

	// Persist to storageService for subsequent fast lookups
	if (storageService) {
		storageService.store(METIS_STORAGE_KYBERNETES_TOKEN_KEY, kybToken, StorageScope.APPLICATION, StorageTarget.USER);
		storageService.store(METIS_STORAGE_HESTIA_TOKEN_KEY, hestiaToken, StorageScope.APPLICATION, StorageTarget.USER);
		storageService.store(METIS_STORAGE_PROSOPON_TOKEN_KEY, prosoponToken, StorageScope.APPLICATION, StorageTarget.USER);
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

	return { kybernetesToken: kybToken, hestiaToken, prosoponToken };
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

/**
 * Synchronous resolver for Prosopon Host Owner / admin token.
 */
export function getMetisProsoponToken(
	storageService?: IStorageService
): string {
	if (_cachedProsoponToken) {
		return _cachedProsoponToken;
	}
	if (storageService) {
		const val = storageService.get(METIS_STORAGE_PROSOPON_TOKEN_KEY, StorageScope.APPLICATION);
		if (val && val !== 'metis-sovereign') {
			_cachedProsoponToken = val;
			return val;
		}
	}
	return '3y-LilvWapsZAVRUOpZCGNZ4L4cE8grWm_7iQQC7PrE';
}

/**
 * Return authorization headers dictionary for Prosopon HTTP calls (Pyle WebRTC, devices, audit).
 */
export function getMetisProsoponHeaders(
	storageService?: IStorageService
): Record<string, string> {
	const token = getMetisProsoponToken(storageService);
	return {
		'Authorization': `Bearer ${token}`,
		'X-Host-Owner-Token': token,
		'Content-Type': 'application/json'
	};
}


