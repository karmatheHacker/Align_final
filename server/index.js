require('dotenv').config();
const express = require('express');
const cors = require('cors');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Supabase admin client (bypasses RLS)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Prompts the admin in the terminal and returns their answer.
 */
function askAdmin(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

// ─── POST /verify-user ──────────────────────────────────────────────────────
app.post('/verify-user', async (req, res) => {
    const { userId, photoUrls } = req.body;

    if (!userId || !photoUrls || !Array.isArray(photoUrls)) {
        return res.status(400).json({ error: 'userId and photoUrls[] are required.' });
    }

    // Print verification request to terminal
    console.log('\n---------------------------------');
    console.log('Verification request received\n');
    console.log(`User ID: ${userId}\n`);
    console.log('Photos:');
    photoUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
    });
    console.log('');

    // Wait for admin decision
    const answer = await askAdmin('Approve verification? (y/n): ');

    let status;
    if (answer === 'y') {
        status = 'approved';
        console.log('>>> Verification APPROVED\n---------------------------------\n');
    } else {
        status = 'rejected';
        console.log('>>> Verification REJECTED\n---------------------------------\n');
    }

    // Update Supabase profiles table
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                clerk_id: userId,
                verification_status: status,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('Supabase update error:', error.message);
        }
    } catch (err) {
        console.error('Failed to update Supabase:', err.message);
    }

    return res.json({ status });
});

// ─── GET /profile/:userId ────────────────────────────────────────────────────
app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.json({ profile: null });
            }
            console.error('Profile fetch error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        return res.json({ profile: data });
    } catch (err) {
        console.error('Profile fetch failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ─── POST /save-profile ─────────────────────────────────────────────────────
app.post('/save-profile', async (req, res) => {
    const profileData = req.body;

    if (!profileData.id) {
        return res.status(400).json({ error: 'id is required' });
    }

    try {
        // Height is stored as two separate columns — split the object if present
        if (profileData.height && typeof profileData.height === 'object') {
            profileData.height_value = profileData.height.value;
            profileData.height_unit = profileData.height.unit;
            delete profileData.height;
        }

        const { error } = await supabase
            .from('profiles')
            .upsert({
                ...profileData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error('Profile save error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        console.log(`Profile saved for user: ${profileData.id}`);
        return res.json({ success: true });
    } catch (err) {
        console.error('Profile save failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ─── PATCH /profile/:userId ──────────────────────────────────────────────────
app.patch('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        // Height is stored as two separate columns — split the object if present
        if (updates.height && typeof updates.height === 'object') {
            updates.height_value = updates.height.value;
            updates.height_unit = updates.height.unit;
            delete updates.height;
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Profile update error:', error.message);
            return res.status(500).json({ error: error.message });
        }

        console.log(`Profile updated for user: ${userId} — fields: ${Object.keys(updates).join(', ')}`);
        return res.json({ profile: data });
    } catch (err) {
        console.error('Profile update failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ─── GET /profile/:userId/full ───────────────────────────────────────────────
// Loads profile + photos + prompts + visibility in a single call
app.get('/profile/:userId/full', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const [profileRes, photosRes, promptsRes, visibilityRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('profile_photos').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
            supabase.from('profile_prompts').select('*').eq('user_id', userId),
            supabase.from('profile_visibility').select('*').eq('user_id', userId),
        ]);

        const profile = profileRes.error?.code === 'PGRST116' ? null : profileRes.data;
        if (profileRes.error && profileRes.error.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileRes.error.message);
        }

        let photosData = photosRes.data || [];

        // Migrate photo_urls from profiles table into profile_photos table ONLY IF profile_photos is empty
        if (photosData.length === 0 && profile && profile.photo_urls && Array.isArray(profile.photo_urls) && profile.photo_urls.length > 0) {
            const inserts = profile.photo_urls.map((url, i) => ({
                user_id: userId,
                photo_url: url,
                order_index: i,
            }));

            const { data: inserted, error: insertError } = await supabase
                .from('profile_photos')
                .insert(inserts)
                .select();

            if (!insertError && inserted) {
                photosData = inserted;
            } else if (insertError) {
                console.error('Error migrating photos:', insertError.message);
            }
        }

        return res.json({
            profile,
            photos: photosData,
            prompts: promptsRes.data || [],
            visibility: visibilityRes.data || [],
        });
    } catch (err) {
        console.error('Full profile fetch failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ─── POST /profile/:userId/photos ───────────────────────────────────────────
app.post('/profile/:userId/photos', async (req, res) => {
    const { userId } = req.params;
    const { photo_url, order_index } = req.body;

    if (!userId || !photo_url) {
        return res.status(400).json({ error: 'userId and photo_url are required' });
    }

    try {
        const { data, error } = await supabase
            .from('profile_photos')
            .insert({ user_id: userId, photo_url, order_index: order_index || 0 })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ photo: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /profile/:userId/photos/:photoId ────────────────────────────────
app.delete('/profile/:userId/photos/:photoId', async (req, res) => {
    const { userId, photoId } = req.params;

    try {
        const { error } = await supabase
            .from('profile_photos')
            .delete()
            .eq('id', photoId)
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── PUT /profile/:userId/photos/reorder ────────────────────────────────────
app.put('/profile/:userId/photos/reorder', async (req, res) => {
    const { userId } = req.params;
    const { photoIds } = req.body; // ordered array of photo IDs

    if (!Array.isArray(photoIds)) {
        return res.status(400).json({ error: 'photoIds array is required' });
    }

    try {
        const updates = photoIds.map((id, index) =>
            supabase.from('profile_photos').update({ order_index: index }).eq('id', id).eq('user_id', userId)
        );
        await Promise.all(updates);

        const { data } = await supabase
            .from('profile_photos')
            .select('*')
            .eq('user_id', userId)
            .order('order_index', { ascending: true });

        return res.json({ photos: data || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── POST /profile/:userId/prompts ──────────────────────────────────────────
app.post('/profile/:userId/prompts', async (req, res) => {
    const { userId } = req.params;
    const { prompt_question, prompt_answer } = req.body;

    if (!userId || !prompt_question) {
        return res.status(400).json({ error: 'userId and prompt_question are required' });
    }

    try {
        const { data, error } = await supabase
            .from('profile_prompts')
            .insert({ user_id: userId, prompt_question, prompt_answer: prompt_answer || '' })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ prompt: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── PATCH /profile/:userId/prompts/:promptId ───────────────────────────────
app.patch('/profile/:userId/prompts/:promptId', async (req, res) => {
    const { userId, promptId } = req.params;
    const { prompt_question, prompt_answer } = req.body;

    try {
        const updates = {};
        if (prompt_question !== undefined) updates.prompt_question = prompt_question;
        if (prompt_answer !== undefined) updates.prompt_answer = prompt_answer;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('profile_prompts')
            .update(updates)
            .eq('id', promptId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ prompt: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /profile/:userId/prompts/:promptId ──────────────────────────────
app.delete('/profile/:userId/prompts/:promptId', async (req, res) => {
    const { userId, promptId } = req.params;

    try {
        const { error } = await supabase
            .from('profile_prompts')
            .delete()
            .eq('id', promptId)
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── PUT /profile/:userId/visibility ────────────────────────────────────────
app.put('/profile/:userId/visibility', async (req, res) => {
    const { userId } = req.params;
    const { field_name, visibility } = req.body;

    if (!field_name || !visibility) {
        return res.status(400).json({ error: 'field_name and visibility are required' });
    }

    try {
        const { data, error } = await supabase
            .from('profile_visibility')
            .upsert(
                { user_id: userId, field_name, visibility, updated_at: new Date().toISOString() },
                { onConflict: 'user_id,field_name' }
            )
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ visibility: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nVerification server running on http://0.0.0.0:${PORT}`);
    console.log('Waiting for verification requests...\n');
});
