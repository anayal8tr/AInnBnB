//imports
const express = require('express');
require('express-async-errors');
const routes = require('./routes');
//Security imports
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');

//utility imports
const cookieParser = require('cookie-parser');
const { environment } = require('./config');
const { ValidationError } = require('sequelize');


const isProduction = environment === 'production';

//Express application
const app = express();

//middleware

app.use(morgan('dev')); // security
app.use(cookieParser()); // Parse cookie from headers
app.use(express.json()); // Allows us to use json in req/res


// Security Middleware
if (!isProduction) {
    // enable cors only in development
    app.use(cors({
        origin: 'http://localhost:5173', // allow requests from this origin
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // allow these HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // allow these headers
    }));
}

// helmet helps set a variety of headers to better secure your app
app.use(
    helmet.crossOriginResourcePolicy({
        policy: "cross-origin"
    })
);

// Set the _csrf token and create req.csrfToken method
app.use(
    csurf({
        cookie: {
            secure: isProduction,
            sameSite: isProduction && "Lax",
            httpOnly: true
        }
    })
);

// --------- MIDDLE WARES MUST BE USED ABOVE THIS LINE ------


// Routes!!!!
app.use(routes); // Connects all our routes

//ERROR HANDLING MIDDLE WARES AND ROUTES

// Catch unhandled requests and forward to error handler.
app.use((_req, _res, next) => {
    const err = new Error("The requested resource couldn't be found.");
    err.title = "Resource Not Found";
    err.errors = { message: "The requested resource couldn't be found." };
    err.status = 404;
    next(err);
});

// Process sequelize errors
app.use((err, _req, _res, next) => {
    // check if error is a Sequelize error:
    if (err instanceof ValidationError) {
        let errors = {};
        for (let error of err.errors) {
            errors[error.path] = error.message;
        }
        err.title = 'Validation error';
        err.errors = errors;
    }
    next(err);
});

// Error formatter
app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    console.error(err);
    res.json({
        title: err.title || 'Server Error',
        message: err.message,
        errors: err.errors,
        stack: isProduction ? null : err.stack
    });
});





module.exports = app;