---
layout: post
title: Grunt - Error Occurred While Processing a Template
date: 2015-05-17 07:00:00
categories: programming
tags:
  - grunt
  - debugging
  - build automation
---

When trying to add `grunt-html-build` to my project in order to template
my `index.html` between dev and production, I started running into the
following error:

> Warning: An error occurred while processing a template (Cannot read
> property 'dist' of undefined). Use --force to continue.

I spent a good amount of time just making sure I was using the correct
parameters to configure `html-build`, and when I was sure I was doing
that, I started to look into the error itself.

I Googled the error and found nothing really relevant except that the
error obviously concerns templates. Since the `grunt-html-build` plugin
allows one to templatize an HTML file, I initially supposed the error
might be due to a problem in the plugin. This was a red herring that
wasted a lot of my time. When I finally decided that the problem wasn't
with the plugin, and must be something else, I decided to take a look
at the source, to better understand what was going on.

I'll be speaking about
[`grunt-html-build` 983aca42874](https://github.com/spatools/grunt-html-build/tree/983aca42874b314cfbbab91631ba968c7309ea16)
below.

I opened `node_modules/grunt-html-build` and looked at the
`package.json` to figure out where the entry point was. Seeing nothing
pertinent, I took a look at the directory structure and noticed the
`tasks` folder, which `grunt` expects its plugins to contain. This
folder contains a single file `build-html.js`. This file contains
a call to `grunt.registerMultiTask`, which registers a task called
`htmlbuild`. The most important method call in this task is to
`transformContent`. I started adding logging statements to narrow
down the error and decided it was line 286 that was the problem:

```javascript
config = grunt.config();
```

Pretty innocuous, no? If we look through the
[grunt source (0.4.5)](https://github.com/gruntjs/grunt/tree/v0.4.5),
the `config` source is at `lib/grunt/config.js`. The call eventually
leads to an invocation of `config.process` on line 55. This, in turn,
leads to a call to `grunt.template.process`. This seems to be the
source of the error, as there is an assignment on line 90 that looks
like:

```javascript
e.message = 'An error occurred while processing a template (' + e.message + ').';
```

I added a line to this method which logged the template in error, and
it was actually a configuration element for `uglify` that referenced a
`concat` task that I had deleted hours before! The `uglify`
configuration looked like:

```javascript
uglify: {
  options: {
    // ...
  },
  dist: {
    src: '<%= concat.dist.dest %>',
    // ...
```

Now, I'm wondering why the message doesn't contain the error-ing
template in question, because that would've saved me a couple hours.

I wrote this up mostly because it might help others but partially
because this is an error that seems incredibly obvious in hindsight.
I think it's these kinds of errors and how quickly one gets past them
that distinguish an experienced developer. While I do believe I was
stuck on this problem much longer than I should've been, I think it's
inevitable that rookie mistakes occasionally plague even more
experienced developers.


