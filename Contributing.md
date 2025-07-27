# Contributing Guide

Keep your repository updated. When a mentor accepts your pull request, it goes into the Academy repository, but not into your fork.

#### 1. Don't commit anything yourself to the `master` of your repository

This will prevent you from neatly updating your repository and may cause conflicts.

#### 2. Before starting a new assignment, update `master`

You can update your repository from the Academy repository like this:

```
# In your local copy, switch to the master branch
git checkout master

# Pull changes from the Academy repository¹
git pull academy master

# Push changes to your fork on GitHub
git push
```

¹ The `academy` should have a link to the Academy repository. If it's not there, add it:

```
git remote add academy git@github.com:htmlacademy-nodejs-api/107440-six-cities-5.git
```

When you've updated `master`, create a branch for the new assignment:

```
git checkout -b module2-task1
```

`module2-task1` is the branch name. Under each assignment description in the intensive interface, the correct branch name will be indicated for you.

--

#### Have a question?

Check out the [collection of frequently asked Git questions](http://firstaidgit.ru).
