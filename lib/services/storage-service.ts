import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Check if a URL is a base64 data URL
 */
export function isBase64DataUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    return url.startsWith('data:image/');
}

/**
 * Get the file extension from a MIME type or data URL
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
    };
    return mimeMap[mimeType] || 'png';
}

/**
 * Extract MIME type from a data URL
 */
function getMimeTypeFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    return match ? match[1] : 'image/png';
}

/**
 * Convert a base64 data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64Data] = dataUrl.split(',');
    const mimeType = getMimeTypeFromDataUrl(dataUrl);
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mimeType });
}

/**
 * Upload an image blob to Firebase Storage
 * @param path - The storage path (e.g., 'quizzes/{quizId}/cover')
 * @param blob - The image blob to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(path: string, blob: Blob): Promise<string> {
    if (!storage) {
        throw new Error('Firebase Storage not initialized');
    }

    const extension = getExtensionFromMimeType(blob.type);
    const fullPath = `${path}.${extension}`;
    const storageRef = ref(storage, fullPath);

    console.log('[StorageService] Uploading image to:', fullPath);

    await uploadBytes(storageRef, blob, {
        contentType: blob.type,
    });

    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[StorageService] Upload complete, URL:', downloadUrl.substring(0, 80) + '...');

    return downloadUrl;
}

/**
 * Delete an image from Firebase Storage
 * @param path - The full storage path to delete
 */
export async function deleteImage(path: string): Promise<void> {
    if (!storage) {
        throw new Error('Firebase Storage not initialized');
    }

    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log('[StorageService] Deleted image:', path);
    } catch (error: any) {
        // Ignore "object not found" errors (already deleted)
        if (error?.code === 'storage/object-not-found') {
            console.log('[StorageService] Image already deleted:', path);
            return;
        }
        throw error;
    }
}

/**
 * Migrate a base64 data URL to Firebase Storage
 * @param dataUrl - The base64 data URL to migrate
 * @param path - The storage path (without extension)
 * @returns The download URL of the uploaded image
 */
export async function migrateBase64ToStorage(
    dataUrl: string,
    path: string
): Promise<string> {
    if (!isBase64DataUrl(dataUrl)) {
        // Not a base64 URL, return as-is
        return dataUrl;
    }

    console.log('[StorageService] Migrating base64 to storage:', path);

    const blob = dataUrlToBlob(dataUrl);
    const downloadUrl = await uploadImage(path, blob);

    console.log('[StorageService] Migration complete for:', path);

    return downloadUrl;
}

/**
 * Generate storage path for quiz cover image
 */
export function getQuizCoverPath(quizId: string): string {
    return `quizzes/${quizId}/cover`;
}

/**
 * Generate storage path for outcome image
 */
export function getOutcomeImagePath(quizId: string, outcomeId: string): string {
    return `quizzes/${quizId}/outcomes/${outcomeId}`;
}

/**
 * Generate storage path for question image
 */
export function getQuestionImagePath(quizId: string, questionId: string): string {
    return `quizzes/${quizId}/questions/${questionId}`;
}

/**
 * Generate storage path for brand kit logo
 */
export function getBrandKitLogoPath(userId: string): string {
    return `users/${userId}/brand-kit/logo`;
}

/**
 * Generate storage path for visual builder block media
 * @param quizId - The quiz ID
 * @param stepId - The step ID containing the block
 * @param blockId - The block ID
 */
export function getBlockMediaPath(quizId: string, stepId: string, blockId: string): string {
    return `quizzes/${quizId}/blocks/${stepId}/${blockId}`;
}

/**
 * Generate storage path for visual builder outcome block media
 * @param quizId - The quiz ID
 * @param outcomeId - The outcome ID containing the block
 * @param blockId - The block ID
 */
export function getOutcomeBlockMediaPath(quizId: string, outcomeId: string, blockId: string): string {
    return `quizzes/${quizId}/outcome-blocks/${outcomeId}/${blockId}`;
}

/**
 * Generate storage path for visual builder video thumbnail
 * @param quizId - The quiz ID
 * @param containerId - The step or outcome ID containing the block
 * @param blockId - The block ID
 */
export function getVideoThumbnailPath(quizId: string, containerId: string, blockId: string): string {
    return `quizzes/${quizId}/thumbnails/${containerId}/${blockId}`;
}

/**
 * Generate storage path for option image in an options block
 * @param quizId - The quiz ID
 * @param containerId - The step or outcome ID containing the block
 * @param blockId - The options block ID
 * @param optionId - The option item ID
 */
export function getOptionImagePath(quizId: string, containerId: string, blockId: string, optionId: string): string {
    return `quizzes/${quizId}/options/${containerId}/${blockId}/${optionId}`;
}
