const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const favoritesRouter = express.Router();
const cors = require("./cors");

favoritesRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user.id })
            .populate("favorites.user")
            .populate("favorites.campsites")
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorites);
            })
            .catch((err) => next(err));
    })
    //request will be an array of objects like this: [{"_id":"campsite ObjectId"}, {"_id":"campsite ObjectId"}]t
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorites) => {
                //check if favorites document exists, create if it doesn't
                if (!favorites) {
                    console.log("Favorites document does not exist, adding favorites document");
                    favorites = new Favorite({ user: req.user._id });
                }
                //check the _id of each object against users favorite documents, if it exists, do nothing, if it doesn't, add it to array
                req.body.forEach((obj) => {
                    if (!favorites.campsites.includes(obj._id)) {
                        favorites.campsites.push(obj._id);
                    } else {
                        console.log(`${obj._id} is already a favorite and has not been added.`);
                    }
                });
                favorites
                    .save()
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorites);
                    })
                    .catch((err) => next(err));
            })
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then((favorites) => {
                //if the favorites document exists, delete it, if it doesn't, do nothing.
                if (favorites) {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorites);
                } else {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "text/plain");
                    res.end("You have no favorites to delete!");
                }
            })
            .catch((err) => next(err));
    });

favoritesRouter
    .route("/:campsiteId")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    //request will be the req.params.campsiteId
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorites) => {
                //check if favorites document exists for this user, if not, create it.
                if (!favorites) {
                    console.log("Favorites document does not exist, adding favorites document");
                    favorites = new Favorite({ user: req.user._id });
                }
                //check if campsiteId from url exists in favorites.campsites, if yes, do nothing, if no, add and save.
                if (!favorites.campsites.includes(req.params.campsiteId)) {
                    favorites.campsites.push(req.params.campsiteId);
                    favorites
                        .save()
                        .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorites);
                        })
                        .catch((err) => next(err));
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} is already in your list of favorites!`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    })

    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorites) => {
                //check if favorites document exists, if so, proceed with logic to delete a favorite, if no, move to error in else block
                if (favorites) {
                    //check if favorites.campsites has the campsiteId in the array, if yes, delete it and save, if no, move to error in else block.
                    if (favorites.campsites.includes(req.params.campsiteId)) {
                        favorites.campsites.splice(favorites.campsites.indexOf(req.params.campsiteId), 1);
                        favorites
                            .save()
                            .then((favorites) => {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(favorites);
                            })
                            .catch((err) => next(err));
                    } else {
                        err = new Error(`Campsite ${req.params.campsiteId} is not in your list of favorites.`);
                        err.status = 404;
                        return next(err);
                    }
                } else {
                    err = new Error("Favorites document does not exist!");
                    err.status = 404;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    });

module.exports = favoritesRouter;
