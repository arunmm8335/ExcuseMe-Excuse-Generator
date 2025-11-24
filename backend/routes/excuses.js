const express = require('express');
const auth = require('../middleware/authMiddleware');
const getOpenAIClient = require('../middleware/aiClient'); // Import the new centralized middleware
const Excuse = require('../models/Excuse');
const router = express.Router();
const { validateComment, handleValidationErrors } = require('../middleware/validation');
const { extractUserIdFromToken } = require('../utils/jwtUtils');
const { getChatFormatPrompt } = require('../utils/chatFormats');
const { toggleLike, toggleDislike } = require('../utils/reactionHelpers');


// @route   POST /api/excuses/generate-stream
// @desc    Generates an excuse using the correct AI client from middleware
// @access  Private
router.post('/generate-stream', [auth, getOpenAIClient], async (req, res) => {
    // By the time this function runs, req.openai is already correctly set by the middleware
    const { scenario, context, urgency, language, examplesPrompt } = req.body;

    console.log('Generate stream request:', { scenario, context, urgency, language });

    // Validate required fields
    if (!scenario) {
        return res.status(400).json({
            success: false,
            msg: "Scenario is required."
        });
    }

    let systemPrompt = `You are Alibai, an intelligent excuse generator. Generate one single, high-quality, creative excuse for the user's situation. Be concise and natural-sounding. Generate the excuse in ${language || 'English'}. Do not add any extra commentary, introductory phrases, or formatting like numbering.`;
    if (examplesPrompt) {
        systemPrompt += examplesPrompt;
    }

    try {
        const successfulExcuses = await Excuse.find({ user: req.user.id, effectiveness: 1 }).sort({ createdAt: -1 }).limit(2);
        if (successfulExcuses.length > 0) {
            const examples = successfulExcuses.map(e => `- "${e.excuseText}"`).join('\n');
            systemPrompt += `\n\nLEARNING: The user has previously had success with excuses like these. Generate a new excuse in a similar style:\n${examples}`;
        }

        const userPrompt = `My situation is: "${scenario}". Context: ${context || 'social'}. Urgency: ${urgency || 'medium'}.`;

        console.log('Sending to OpenAI:', { systemPrompt, userPrompt });

        const stream = await req.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            stream: true
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (error) {
        console.error("AI Generation Error in Route:", error.message);
        const userErrorMessage = "An error occurred with the AI. If using your own key, it may be invalid or out of credits.";
        res.write(`data: ${JSON.stringify({ content: userErrorMessage })}\n\ndata: [DONE]\n\n`);
        res.end();
    }
});


// @route   POST /api/excuses/apology
// @desc    Generate an apology using the correct AI client from middleware
// @access  Private
router.post('/apology', [auth, getOpenAIClient], async (req, res) => {
    const { scenario, excuseText, language } = req.body;

    // Validate required fields
    if (!scenario || !excuseText) {
        return res.status(400).json({
            success: false,
            msg: "Missing required fields: scenario and excuseText are required."
        });
    }

    console.log('Apology generation request:', { scenario, excuseText, language });

    const systemPrompt = `You are Alibai, an AI specializing in apologies. Craft a professional or emotional apology in ${language || 'English'}. Make it sound sincere, with a subtle guilt-tripping tone.`;
    const userPrompt = `The situation was: "${scenario}". My excuse was: "${excuseText}". Now create a suitable apology.`;

    try {
        const chatCompletion = await req.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.8
        });

        const apologyText = chatCompletion.choices[0].message.content.trim();
        console.log('Apology generation success:', { apologyText });

        res.json({
            success: true,
            apologyText
        });
    } catch (error) {
        console.error("Apology Generation Error:", error.message);
        res.status(500).json({
            success: false,
            msg: "Error communicating with AI for apology.",
            error: error.message
        });
    }
});


// @route   POST /api/excuses/proof
// @desc    Generate proof using the correct AI client from middleware
// @access  Private
router.post('/proof', [auth, getOpenAIClient], async (req, res) => {
    const { scenario, excuseText, language, platform, senderName, receiverName } = req.body;

    // Validate required fields
    if (!scenario || !excuseText) {
        return res.status(400).json({
            success: false,
            msg: "Missing required fields: scenario and excuseText are required."
        });
    }

    console.log('Proof generation request:', { scenario, excuseText, language, platform });

    const meName = senderName && senderName.trim() ? senderName.trim() : 'Me';
    const otherName = receiverName && receiverName.trim() ? receiverName.trim() : 'Mom';

    const stylePrompt = getChatFormatPrompt(platform, meName, otherName);

    const systemPrompt = `You are a scriptwriter. Create a short, realistic chat (3-5 lines) between '${meName}' and '${otherName}' that supports an excuse. ${stylePrompt} Generate the dialogue in ${language || 'English'}.`;
    const userPrompt = `The situation: "${scenario}". The excuse used: "${excuseText}". Write a fake chat log for this.`;

    try {
        const chatCompletion = await req.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.9
        });

        const proofText = chatCompletion.choices[0].message.content.trim();
        console.log('Proof generation success:', { proofText });

        res.json({
            success: true,
            proofText
        });
    } catch (error) {
        console.error("Proof Generation Error:", error.message);
        res.status(500).json({
            success: false,
            msg: "Error communicating with AI for proof.",
            error: error.message
        });
    }
});


// ALL OTHER DATA-ONLY ROUTES (no AI calls) DO NOT NEED THE `getOpenAIClient` MIDDLEWARE

// @route   POST /api/excuses/save
// @desc    Save an excuse to the database
// @access  Private
router.post('/save', auth, async (req, res) => {
    try {
        const { scenario, context, excuseText } = req.body;

        // Validate required fields
        if (!scenario || !context || !excuseText) {
            return res.status(400).json({
                success: false,
                msg: "Missing required fields: scenario, context, and excuseText are required."
            });
        }

        console.log('Saving excuse:', { scenario, context, excuseText, userId: req.user.id });

        // Validate the data before creating the model
        if (!scenario || typeof scenario !== 'string') {
            throw new Error('Invalid scenario: must be a non-empty string');
        }
        if (!excuseText || typeof excuseText !== 'string') {
            throw new Error('Invalid excuseText: must be a non-empty string');
        }
        if (!context || !['work', 'school', 'social', 'family', 'dating', 'travel', 'health', 'legal', 'tech', 'other'].includes(context)) {
            throw new Error('Invalid context: must be one of work, school, social, family, dating, travel, health, legal, tech, other');
        }

        const newExcuse = new Excuse({
            user: req.user.id,
            scenario,
            excuseText,
            context
        });

        console.log('Created excuse model:', newExcuse);

        await newExcuse.save();

        console.log('Excuse saved successfully:', newExcuse._id);

        res.status(201).json({
            success: true,
            ...newExcuse.toObject()
        });

    } catch (err) {
        console.error("Save Excuse Error:", err.message);
        res.status(500).json({
            success: false,
            msg: "Failed to save excuse to database.",
            error: err.message
        });
    }
});
router.get('/history', auth, async (req, res) => { try { const excuses = await Excuse.find({ user: req.user.id }).sort({ createdAt: -1 }); res.json(excuses); } catch (err) { res.status(500).send('Server Error'); } });
router.patch('/:id/favorite', auth, async (req, res) => { try { const excuse = await Excuse.findById(req.params.id); if (!excuse) return res.status(404).json({ msg: 'Excuse not found' }); if (excuse.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' }); excuse.isFavorite = !excuse.isFavorite; await excuse.save(); res.json(excuse); } catch (err) { res.status(500).send('Server Error'); } });
// @route   PATCH /api/excuses/:id/rate
// @desc    Rate an excuse (effectiveness: 1 for thumbs up, -1 for thumbs down, 0 for neutral)
// @access  Private
router.patch('/:id/rate', auth, async (req, res) => {
    try {
        const { rating } = req.body; // rating should be 1, -1, or 0
        if (![1, 0, -1].includes(rating)) {
            return res.status(400).json({ msg: 'Invalid rating value' });
        }
        const excuse = await Excuse.findOne({ _id: req.params.id, user: req.user.id });
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        excuse.effectiveness = rating;
        await excuse.save();
        res.json({ msg: 'Rating saved!', effectiveness: excuse.effectiveness });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});
router.delete('/:id', auth, async (req, res) => { try { const excuse = await Excuse.findById(req.params.id); if (!excuse) { return res.status(404).json({ msg: 'Excuse not found' }); } if (excuse.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); } await excuse.deleteOne(); res.json({ msg: 'Excuse removed' }); } catch (err) { res.status(500).send('Server Error'); } });
router.get('/pattern', auth, async (req, res) => { try { const userHistory = await Excuse.find({ user: req.user.id }); if (userHistory.length < 3) return res.json({ suggestion: null }); const keywordMap = { sick: ["sick", "unwell", "fever"], appointment: ["appointment", "doctor"], family: ["family", "emergency"], }; const dayCounts = {}; const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; userHistory.forEach(excuse => { const day = daysOfWeek[new Date(excuse.createdAt).getDay()]; if (!dayCounts[day]) dayCounts[day] = {}; for (const category in keywordMap) { if (keywordMap[category].some(k => excuse.scenario.toLowerCase().includes(k))) { dayCounts[day][category] = (dayCounts[day][category] || 0) + 1; } } }); let suggestion = null; for (const day in dayCounts) { for (const category in dayCounts[day]) { if (dayCounts[day][category] >= 3) { suggestion = `We've noticed you often need an excuse about being '${category}' on ${day}s. Need help preparing one?`; break; } } if (suggestion) break; } res.json({ suggestion }); } catch (err) { res.status(500).send('Server Error'); } });

// Helper to add like/dislike info to an excuse
function addLikeDislikeInfo(excuse, userId) {
    return {
        ...excuse.toObject(),
        likes: excuse.likedBy.length,
        dislikes: excuse.dislikedBy.length,
        userLike: userId ? excuse.likedBy.map(id => id.toString()).includes(userId) : false,
        userDislike: userId ? excuse.dislikedBy.map(id => id.toString()).includes(userId) : false,
        views: excuse.views || 0
    };
}

// @route   GET /api/excuses/public
// @desc    Get public, active excuses for the community wall (paginated, filterable)
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const filter = { isPublic: true, status: 'active' };

        // Filtering
        if (req.query.scenario) {
            filter.scenario = { $regex: req.query.scenario, $options: 'i' };
        }
        if (req.query.author) {
            filter.publicAuthor = { $regex: req.query.author, $options: 'i' };
        }
        if (req.query.minLikes) {
            filter.likes = { $gte: parseInt(req.query.minLikes) };
        }
        if (req.query.search) {
            filter.$or = [
                { excuseText: { $regex: req.query.search, $options: 'i' } },
                { scenario: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        // Use exact match for context (category) filter
        if (req.query.context) {
            filter.context = req.query.context;
            // To revert to partial match, use:
            // filter.context = { $regex: req.query.context, $options: 'i' };
        }

        const total = await Excuse.countDocuments(filter);
        const excuses = await Excuse.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-reports') // Hide reports count from public
            .populate('user', 'name profilePic');

        // Try to get userId from token if present
        let userId = null;
        if (req.headers['x-auth-token']) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(req.headers['x-auth-token'], process.env.JWT_SECRET);
                userId = decoded.id;
            } catch { }
        }

        res.json({
            excuses: excuses.map(e => addLikeDislikeInfo(e, userId)),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error fetching public excuses.' });
    }
});

// Like endpoint with per-user logic
router.post('/:id/like', auth, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse || !excuse.isPublic || excuse.status !== 'active') {
            return res.status(404).json({ msg: 'Excuse not found or not public.' });
        }
        const result = toggleLike(excuse, req.user.id);
        await excuse.save();
        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: 'Server error liking excuse.' });
    }
});

// Dislike endpoint with per-user logic
router.post('/:id/dislike', auth, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse || !excuse.isPublic || excuse.status !== 'active') {
            return res.status(404).json({ msg: 'Excuse not found or not public.' });
        }
        const result = toggleDislike(excuse, req.user.id);
        await excuse.save();
        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: 'Server error disliking excuse.' });
    }
});

// @route   POST /api/excuses/:id/report
// @desc    Report a public excuse for moderation
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse || !excuse.isPublic || excuse.status !== 'active') {
            return res.status(404).json({ msg: 'Excuse not found or not public.' });
        }
        excuse.reports += 1;
        // Optional: auto-hide if too many reports
        if (excuse.reports >= 5) {
            excuse.status = 'hidden';
        }
        await excuse.save();
        res.json({ reports: excuse.reports, status: excuse.status });
    } catch (err) {
        res.status(500).json({ msg: 'Server error reporting excuse.' });
    }
});

// @route   PATCH /api/excuses/:id/public
// @desc    Make an excuse public (optionally set publicAuthor)
// @access  Private
router.patch('/:id/public', auth, async (req, res) => {
    try {
        const { publicAuthor } = req.body;
        const excuse = await Excuse.findOne({ _id: req.params.id, user: req.user.id });
        if (!excuse) {
            return res.status(404).json({ msg: 'Excuse not found or not yours.' });
        }
        excuse.isPublic = true;
        excuse.status = 'active';
        excuse.publicAuthor = publicAuthor || 'anonymous';
        await excuse.save();
        res.json({ success: true, isPublic: excuse.isPublic, publicAuthor: excuse.publicAuthor });
    } catch (err) {
        res.status(500).json({ msg: 'Server error making excuse public.' });
    }
});

// @route   GET /api/excuses/:id/comments
// @desc    Get all comments for an excuse
// @access  Public
router.get('/:id/comments', async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id).populate('comments.user', 'name profilePic');
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        res.json({ comments: excuse.comments });
    } catch (err) {
        res.status(500).json({ msg: 'Server error fetching comments.' });
    }
});

// @route   POST /api/excuses/:id/comments
// @desc    Add a comment to an excuse
// @access  Private
router.post('/:id/comments', auth, validateComment, handleValidationErrors, async (req, res) => {
    try {
        const { text, authorName } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ msg: 'Comment text is required.' });
        }
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        const comment = {
            user: req.user.id,
            authorName: authorName || 'anonymous',
            text: text.trim(),
            createdAt: new Date()
        };
        excuse.comments.push(comment);
        await excuse.save();
        res.status(201).json({ comment });
    } catch (err) {
        res.status(500).json({ msg: 'Server error adding comment.' });
    }
});

// @route   DELETE /api/excuses/:excuseId/comments/:commentId
// @desc    Delete a comment (owner or moderator only)
// @access  Private
router.delete('/:excuseId/comments/:commentId', auth, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.excuseId);
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        const comment = excuse.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: 'Comment not found' });
        // Only owner or moderator can delete
        if (comment.user.toString() !== req.user.id /* && !req.user.isModerator */) {
            return res.status(403).json({ msg: 'Not authorized to delete this comment.' });
        }
        comment.remove();
        await excuse.save();
        res.json({ msg: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error deleting comment.' });
    }
});

// @route   GET /api/excuses/trending
// @desc    Get top 5 trending public excuses (by likes, then recency)
// @access  Public
router.get('/trending', async (req, res) => {
    try {
        const trending = await Excuse.find({ isPublic: true, status: 'active' })
            .sort({ likes: -1, createdAt: -1 })
            .limit(5)
            .select('-reports')
            .populate('user', 'name profilePic');

        // Try to get userId from token if present
        let userId = null;
        if (req.headers['x-auth-token']) {
            userId = extractUserIdFromToken(req.headers['x-auth-token']);
        }

        res.json({ trending: trending.map(e => addLikeDislikeInfo(e, userId)) });
    } catch (err) {
        res.status(500).json({ msg: 'Server error fetching trending excuses.' });
    }
});

// Middleware to check moderator
function requireModerator(req, res, next) {
    if (!req.user || !req.user.isModerator) {
        return res.status(403).json({ msg: 'Moderator access required.' });
    }
    next();
}

// @route   GET /api/excuses/reported
// @desc    List reported excuses (for moderators)
// @access  Moderator
router.get('/reported', auth, requireModerator, async (req, res) => {
    try {
        const reported = await Excuse.find({ reports: { $gt: 0 } }).sort({ reports: -1, createdAt: -1 });
        res.json({ reported });
    } catch (err) {
        res.status(500).json({ msg: 'Server error fetching reported excuses.' });
    }
});

// @route   PATCH /api/excuses/:id/hide
// @desc    Hide an excuse (moderator)
// @access  Moderator
router.patch('/:id/hide', auth, requireModerator, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        excuse.status = 'hidden';
        await excuse.save();
        res.json({ msg: 'Excuse hidden' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error hiding excuse.' });
    }
});

// @route   PATCH /api/excuses/:id/restore
// @desc    Restore an excuse (moderator)
// @access  Moderator
router.patch('/:id/restore', auth, requireModerator, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        excuse.status = 'active';
        excuse.reports = 0;
        await excuse.save();
        res.json({ msg: 'Excuse restored' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error restoring excuse.' });
    }
});

// @route   DELETE /api/excuses/:excuseId/comments/:commentId/mod
// @desc    Remove a comment (moderator)
// @access  Moderator
router.delete('/:excuseId/comments/:commentId/mod', auth, requireModerator, async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.excuseId);
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        const comment = excuse.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: 'Comment not found' });
        comment.remove();
        await excuse.save();
        res.json({ msg: 'Comment removed by moderator' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error removing comment.' });
    }
});

// @route   PATCH /api/excuses/:id/view
// @desc    Increment the views count for an excuse
// @access  Public
router.patch('/:id/view', async (req, res) => {
    try {
        const excuse = await Excuse.findById(req.params.id);
        if (!excuse) return res.status(404).json({ msg: 'Excuse not found' });
        excuse.views = (excuse.views || 0) + 1;
        await excuse.save();
        res.json({ views: excuse.views });
    } catch (err) {
        res.status(500).json({ msg: 'Server error incrementing views.' });
    }
});

module.exports = router;
