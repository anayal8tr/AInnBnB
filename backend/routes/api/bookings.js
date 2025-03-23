const express = require('express');
const { Booking, Spot } = require('../../db/models');
const { handleValidationErrors } = require('../../utils/validation');
const { check } = require('express-validator');
const router = express.Router();
const { Op } = require('sequelize');

const validateBooking = [
    check("startDate")
        .exists({checkFalsy: true})
        .isString()
        .withMessage("Start Date needs to be a string."),
    check("endDate")
        .exists({checkFalsy: true})
        .isString()
        .withMessage("End Date needs to be a string."),
    handleValidationErrors
];

// GET all bookings of the current user
router.get('/current', async (req, res, next) => {
    try {
        const currUser = req.user.id;
        const userSpot = await Booking.findAll({
            where: {
                userId: currUser
            },
            include: [{
                model: Spot
            }]
        });
        if (!req.user) {
            const error = new Error("Authentication required");
            error.status = 401;
            throw error;
        }
        if (!userSpot[0]) {
            const error = new Error("No bookings found for this user");
            error.status = 404;
            throw error;
        }

        return res.json(userSpot);
    } catch (error) {
        next(error);
    }
});

// PUT update a booking by bookingId
router.put('/:bookingId', validateBooking, async (req, res, next) => {
    try {
        const bookingId = req.params.bookingId;
        const { startDate, endDate } = req.body;
        const userId = req.user.id;

        if (!bookingId) {
            const error = new Error("Booking not found");
            error.status = 404;
            throw error;
        }

        if (isNaN(Date.parse(startDate))) {
            const error = new Error("Invalid start date format");
            error.status = 400;
            throw error;
        }
        if (isNaN(Date.parse(endDate))) {
            const error = new Error("Invalid end date format");
            error.status = 400;
            throw error;
        }

        if (Date.parse(startDate) < Date.now()) {
            const error = new Error("Start date cannot be in the past");
            error.status = 403;
            throw error;
        }
        if (Date.parse(endDate) <= Date.parse(startDate)) {
            const error = new Error("End date cannot be on or before start date");
            error.status = 400;
            throw error;
        }

        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            const error = new Error("Booking not found");
            error.status = 404;
            throw error;
        }

        if (booking.userId !== userId) {
            const error = new Error("You are not authorized to update this booking");
            error.status = 403;
            throw error;
        }

        const bookings = await Booking.findAll({
            where: {
                id: bookingId
            }
        });
        for (let book of bookings) {
            const bookBody = book.toJSON();
            if (Date.parse(startDate) === Date.parse(bookBody.startDate)) {
                const error = new Error("This start date is already booked");
                error.status = 403;
                throw error;
            }
            if (Date.parse(endDate) === Date.parse(bookBody.endDate)) {
                const error = new Error("This end date is already taken");
                error.status = 403;
                throw error;
            }
            if (Date.parse(startDate) >= Date.parse(bookBody.startDate) && Date.parse(endDate) <= Date.parse(bookBody.endDate)) {
                const error = new Error("These dates are already being booked");
                error.status = 403;
                throw error;
            }
        }
        await booking.update({ startDate, endDate });
        return res.json(booking);
    } catch (error) {
        next(error);
    }
});

// DELETE a booking by bookingId
router.delete('/:bookingId', async (req, res, next) => {
    try {
        const bookingId = req.params.bookingId;
        const userId = req.user.id;

        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            const error = new Error("Booking not found");
            error.status = 404;
            throw error;
        }

        if (booking.userId !== userId) {
            const error = new Error("You are not authorized to delete this booking");
            error.status = 403;
            throw error;
        }

        await booking.destroy();
        return res.json({ message: "Booking successfully deleted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
