/**
 * Toggle like status for an excuse
 * @param {Object} excuse - The excuse document
 * @param {string} userId - The user's ID
 * @returns {Object} - Updated like/dislike counts and user status
 */
const toggleLike = (excuse, userId) => {
    // Remove from dislikedBy if present
    excuse.dislikedBy = excuse.dislikedBy.filter(id => id.toString() !== userId);
    
    const liked = excuse.likedBy.map(id => id.toString()).includes(userId);
    
    if (liked) {
        // Undo like
        excuse.likedBy = excuse.likedBy.filter(id => id.toString() !== userId);
    } else {
        // Add to likedBy if not present
        excuse.likedBy.push(userId);
    }
    
    // Ensure no duplicates
    excuse.likedBy = [...new Set(excuse.likedBy.map(id => id.toString()))].map(id => 
        excuse.likedBy.find(objId => objId.toString() === id)
    );
    
    return {
        likes: excuse.likedBy.length,
        dislikes: excuse.dislikedBy.length,
        userLike: !liked,
        userDislike: false
    };
};

/**
 * Toggle dislike status for an excuse
 * @param {Object} excuse - The excuse document
 * @param {string} userId - The user's ID
 * @returns {Object} - Updated like/dislike counts and user status
 */
const toggleDislike = (excuse, userId) => {
    // Remove from likedBy if present
    excuse.likedBy = excuse.likedBy.filter(id => id.toString() !== userId);
    
    const disliked = excuse.dislikedBy.map(id => id.toString()).includes(userId);
    
    if (disliked) {
        // Undo dislike
        excuse.dislikedBy = excuse.dislikedBy.filter(id => id.toString() !== userId);
    } else {
        // Add to dislikedBy if not present
        excuse.dislikedBy.push(userId);
    }
    
    // Ensure no duplicates
    excuse.dislikedBy = [...new Set(excuse.dislikedBy.map(id => id.toString()))].map(id => 
        excuse.dislikedBy.find(objId => objId.toString() === id)
    );
    
    return {
        likes: excuse.likedBy.length,
        dislikes: excuse.dislikedBy.length,
        userLike: false,
        userDislike: !disliked
    };
};

module.exports = {
    toggleLike,
    toggleDislike
};
