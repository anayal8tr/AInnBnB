// backend/routes/api/session.js
// Express imports
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Security Imports
const { setTokenCookie, restoreUser } = require('../../utils/auth');

//Utilities
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

// Sequelize Imports 
const { User } = require('../../db/models');

const router = express.Router();


//Protections for Login input data
const validateLogin = [
    check('credential')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('Please provide a valid email or username.'),
    check('password')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a password.'),
    handleValidationErrors
];

// Log in
router.post('/', validateLogin, async (req, res, next) => {
    try {
        const { credential, password } = req.body;

        const errors = {};
        if (!credential) errors.credential = "Email or username is required";
        if (!password) errors.password = "Password is required";

        if (Object.keys(errors).length > 0) {
            const error = new Error("Validation error");
            error.status = 400;
            error.errors = errors;
            throw error;
        }

        const user = await User.unscoped().findOne({
            where: {
                [Op.or]: {
                    username: credential,
                    email: credential
                }
            }
        });

        if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
            const error = new Error("Invalid credentials");
            error.status = 401;
            throw error;
        }

        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
        };

        await setTokenCookie(res, safeUser);

        return res.json({
            user: safeUser
        });
    } catch (error) {
        next(error);
    }
});

// Log out
router.delete('/', (_req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'success' });
});


// Restore session user
router.get('/', (req, res) => {
    const { user } = req;
    if (user) {
        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
        };
        return res.json({
            user: safeUser
        });
    } else return res.json({ user: null });
});



module.exports = router;