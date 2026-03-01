import { supabase, getAuthenticatedSupabase } from '../config/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Uploads a local file to a Supabase Storage bucket.
 *
 * @param bucketName The exact name of your bucket (e.g., 'profile_photos')
 * @param filePath The destination path/filename inside the bucket (e.g., 'users/user123/avatar.jpg')
 * @param localUri The local file URI (from the image picker, usually file://...)
 * @param token Optional Clerk JWT to authenticate the request (required for RLS)
 * @returns The public URL of the uploaded image if successful
 */
export const uploadFileToSupabase = async (bucketName: string, filePath: string, localUri: string, token?: string): Promise<string | null> => {
    try {
        const client = token ? getAuthenticatedSupabase(token) : supabase;

        // Vastly faster native base64 conversion bypassing manual thread chunking!
        const base64Data = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });


        // Supabase has strict requirements for file uploads from React Native
        // Best approach is decode via base64-arraybuffer
        const fileExt = localUri.split('.').pop()?.toLowerCase();
        let contentType = 'image/jpeg';
        if (fileExt === 'png') contentType = 'image/png';
        if (fileExt === 'gif') contentType = 'image/gif';
        if (fileExt === 'webp') contentType = 'image/webp';

        const { data, error } = await client.storage
            .from(bucketName)
            .upload(filePath, decode(base64Data), {
                contentType: contentType,
                upsert: true,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        // Return the public URL on success
        const { data: { publicUrl } } = client.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (err) {
        console.error('Failed to upload via uploadFileToSupabase:', err);
        return null;
    }
};
