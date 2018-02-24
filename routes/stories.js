const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { ensureAuthenticated, ensureGuest } = require('../helpers/auth');
const Story = mongoose.model('stories');
const User = mongoose.model('users');

// Stories Index
router.get('/', (req, res) => {
    Story.find({ status: 'public' })
        .populate('user')
        .sort({date: 'desc'})
        .then(stories => {
            res.render('stories/index', { stories });
        });
});

// List stories from a specific user
router.get('/user/:userId', (req, res) => {
   Story.find({user: req.params.userId, status: 'public'})
       .populate('user')
       .then(stories => {
           res.render('stories/index', {stories});
       });
});

// List stories for login user
router.get('/my', ensureAuthenticated, (req, res) => {
    Story.find({user: req.user.id})
        .populate('user')
        .then(stories => {
            res.render('stories/index', {stories});
        });
});

// Show single story
router.get('/show/:id', (req, res) => {
    Story.findOne({
        _id: req.params.id
    })
        .populate('user')
        .populate('comments.commentUser')
        .then(story => {
            if (story.status === 'public' || (req.user && (story.user.id === req.user.id))) {
                return res.render('stories/show', { story });
            }
            res.redirect('/stories');
        });
});

// Add Story Form
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('stories/add')
});

// Edit Story Form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Story.findOne({
        _id: req.params.id,
        user: req.user._id
    })
        .then(story => {
            if (story) {
                return res.render('stories/edit', { story });
            }
            res.redirect('/stories');
        });
});

// Process Add Story
router.post('/', (req, res) => {
    let allowComments = false;

    if (req.body.allowComments) {
        allowComments = true;
    }

    const newStory = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        allowComments,
        user: req.user.id
    };

    // Create story
    new Story(newStory)
        .save()
        .then(story => {
            res.redirect(`/stories/show/${story._id}`);
        })
});

// Edit Form Process
router.put('/:id', (req, res) => {
    Story.findOne({
        _id: req.params.id
    })
        .then(story => {
            let allowComments = false;

            if (req.body.allowComments) {
                allowComments = true;
            }

            // New values
            story.title = req.body.title;
            story.body = req.body.body;
            story.status = req.body.status;
            story.allowComments = allowComments;

            story.save()
                .then(story => res.redirect('/dashboard'));
        });
});

// Delete Story
router.delete('/:id', (req, res) => {
    Story.remove({_id: req.params.id})
        .then(() => {
            res.redirect('/dashboard');
        });
});

// Add Comment
router.post('/comment/:id', (req, res) => {
   Story.findOne({_id: req.params.id})
       .then(story => {
           const newComment = {
               commentBody: req.body.commentBody,
               commentUser: req.user._id
           };

           // Push to comments array
           story.comments.unshift(newComment);

           story.save()
               .then(story => {
                   res.redirect(`/stories/show/${story._id}`);
               });
       });
});

module.exports = router;