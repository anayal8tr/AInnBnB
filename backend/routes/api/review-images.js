const express = require('express');
const { ReviewImage, Review } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const router = express.Router();

//DELETE Delete a Review image by its ID
router.delete('/:reviewImageId', async (req, res, next) => {
    try {
        const reviewImageId = req.params.reviewImageId;
        const reviewImageToDelete = await ReviewImage.findByPk(reviewImageId);

        if (!reviewImageToDelete) {
            const error = new Error("Review Image couldn't be found");
            error.status = 404;
            throw error;
        }

        await reviewImageToDelete.destroy();
        return res.json({ message: "Review Image successfully deleted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;