const express = require('express');
const { Op } = require('sequelize');
// Security Imports
const { setTokenCookie, restoreUser } = require('../../utils/auth');
//Utilities
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
// Sequelize Imports 
const { SpotImage, Spots} = require('../../db/models');
const router = express.Router();

//PROTECT INCOMING DATA FOR THE Create Spots ROUTE

router.delete('/:imageId', async (req, res, next) => {
    try {
        const imageId = req.params.imageId;
        const imageToDelete = await SpotImage.findByPk(imageId);

        if (!imageToDelete) {
            const error = new Error("Spot Image couldn't be found");
            error.status = 404;
            throw error;
        }

        await imageToDelete.destroy();
        return res.json({ message: "Successfully deleted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;