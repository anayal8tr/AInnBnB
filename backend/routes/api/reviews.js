const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
// Security Imports
const { restoreUser, requireAuth } = require('../../utils/auth');

//Utilities
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

// Sequelize Imports 
const { Review, ReviewImage, Spot, User } = require('../../db/models');

const router = express.Router();

// Format dates 
// const formatDate = (date) => date.toISOString().replace('T', ' ').substring(0, 19);

// Getting all reviews of the current user
router.get('/current', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const reviews = await Review.findAll({
            where: { userId },
            include: [
                { model: User, attributes: ['id', 'firstName', 'lastName'] },
                { model: Spot, attributes: ['id', 'userId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price',"createdAt","updatedAt"] },
                { model: ReviewImage, attributes: ['id', 'url'] }
            ]
        });

        return res.json({ Reviews: reviews });
    } catch (error) {
        next(error);
    }
});


// Get all reviews for a Spot by Spot ID
router.get('/:spotId/reviews', async (req, res, next) => {
    try {
        const { spotId } = req.params;

        const spot = await Spot.findByPk(spotId);
        if (!spot) {
            const error = new Error("Spot couldn't be found");
            error.status = 404;
            throw error;
        }

        const reviews = await Review.findAll({
            where: { spotId },
            include: [
                { model: User, attributes: ['id', 'firstName', 'lastName'] },
                { model: ReviewImage, attributes: ['id', 'url'] }
            ]
        });

        return res.json({ Reviews: reviews });
    } catch (error) {
        next(error);
    }
});

//  Create a Review for a Spot
router.post('/:spotId/reviews', requireAuth, async (req, res, next) => {
    try {
        const { spotId } = req.params;
        const { review, stars } = req.body;
        const userId = req.user.id;

        const spot = await Spot.findByPk(spotId);
        if (!spot) {
            const error = new Error("Spot couldn't be found");
            error.status = 404;
            throw error;
        }

        const existingReview = await Review.findOne({ where: { spotId, userId } });
        if (existingReview) {
            const error = new Error("User already has a review for this spot");
            error.status = 403;
            throw error;
        }

        if (!review || !stars || stars < 1 || stars > 5) {
            const error = new Error("Validation error");
            error.status = 400;
            error.errors = {
                review: "Review text is required",
                stars: "Stars must be an integer from 1 to 5"
            };
            throw error;
        }

        const newReview = await Review.create({
            userId,
            spotId,
            review,
            stars
        });

        return res.status(201).json(newReview);
    } catch (error) {
        next(error);
    }
});

//  Add an Image to a Review
router.post('/:reviewId/images', requireAuth, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { url } = req.body;
        const userId = req.user.id;

        const review = await Review.findByPk(reviewId);
        if (!review) {
            const error = new Error("Review couldn't be found");
            error.status = 404;
            throw error;
        }

        if (review.userId !== userId) {
            const error = new Error("Forbidden");
            error.status = 403;
            throw error;
        }

        const imageCount = await ReviewImage.count({ where: { reviewId } });
        if (imageCount >= 10) {
            const error = new Error("Maximum number of images for this resource was reached");
            error.status = 403;
            throw error;
        }

        const newImage = await ReviewImage.create({ reviewId, url });

        return res.json(newImage);
    } catch (error) {
        next(error);
    }
});

//  Edit a Review
router.put('/:reviewId', requireAuth, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { review, stars } = req.body;
        const userId = req.user.id;

        const existingReview = await Review.findByPk(reviewId);
        if (!existingReview) {
            const error = new Error("Review couldn't be found");
            error.status = 404;
            throw error;
        }

        if (existingReview.userId !== userId) {
            const error = new Error("Forbidden");
            error.status = 403;
            throw error;
        }

        if (!review || !stars || stars < 1 || stars > 5) {
            const error = new Error("Validation error");
            error.status = 400;
            error.errors = {
                review: "Review text is required",
                stars: "Stars must be an integer from 1 to 5"
            };
            throw error;
        }

        existingReview.review = review;
        existingReview.stars = stars;
        await existingReview.save();

        return res.json(existingReview);
    } catch (error) {
        next(error);
    }
});

//  Delete a Review
router.delete('/:reviewId', requireAuth, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findByPk(reviewId);
        if (!review) {
            const error = new Error("Review couldn't be found");
            error.status = 404;
            throw error;
        }

        if (review.userId !== userId) {
            const error = new Error("Forbidden");
            error.status = 403;
            throw error;
        }

        await review.destroy();

        return res.json({ message: "Successfully deleted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
