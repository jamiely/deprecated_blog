---
layout: post
status: draft
published: true
title: CiteThis! Revisited
author: Jamie
date: 2017-12-10
categories:
- Software
tags:
- firefox
- WebExtension API
---

A Refresher
===========

It's been over a year since I last posted. I hadn't planned on working
on anything to close out the year, but then Firefox released Quantum.

With Quantum, Mozilla's old, deprecated extension API has been removed
in favor of the standardized WebExtensions API. Along with this removal,
the first and only Firefox extension I wrote, called CiteThis! stopped
working and I got several emails and even a GitHub issue opened up in
about it. "People actually still used my extension?" I thought with
wonder.

Honestly I didn't even remember how it worked. I downloaded an old
version of Firefox to refresh my memory. CiteThis! will open a panel at
the bottom of the screen. A citation for the current page will be shown. The
extension code attempts to determine citation fields from looking at
elements on the page. This citation may be added to a list
of citations for ease of copying.

Here are some user stories for the citation as it currently functions:

* Users should see a generated citation for the current page.
* Users should be able to save the citation for later use.
* Users should be able to customize parts of the citation such as:
  author, year, title, url, accessed date, and updated date.
* Users should be able to select the style of citation, one of APA, AMA, MLA.
* Users should be able to customize the date format.

Beyond these stories, there is customized functionality for certain
popular websites, attempting to match the layout style they use to grab
results.

To Arms
=======

So let's get to work updating the plugin for Firefox Quantum. Looking
through the extension developer guide, there's [more extensive
documentation](https://developer.mozilla.org/en-US/Add-ons/WebExtensions)
and [much better tooling](https://github.com/mozilla/web-ext)
than when I originally started on the extension ten years ago!

Hopefully this will be easy, but I'm reluctant to look at cold so old.
There's an old programmer joke about going into some code and cursing
the developer who left such a mess, and, ha-ha, it's you!

The documentation includes a bunch of examples to get started. Let's
take a look at ["annotate page"](https://github.com/mdn/webextensions-examples/tree/master/annotate-page). I copied parts of this extension to get a sense of
what has changed, and I was very happy to see that the UI is just HTML
and CSS. The old version of my extension used
[Mozilla XUL](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL) and
was annoying to program.

Workflow
========

By far the most difficult part of writing the extension the first time,
other than that I wrote it with 10 years less experience than I have
now, is the workflow. Although I could've been making a mistake due to
my inexperience, I remember at the time having the repeatedly reload the
browser to test changes in my extension.

The [web-ext tool](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext)
will watch the files you're editing and automatically reload the
extension code when the files change. Awesome! I recommend creating a
separate Firefox profile for development and running web-ext like:

```
web-ext run --firefox-profile=your-custom-profile
```

Another pain point I had was that I debugged by outputting log statement
into a textbox that I'd make visible on my extension during development.
Instead, now we can debug an extension by entering `about:debugging` in
the address bar, and selecting the Debug option under your extension. [1]
This opens web developer tools for your extension.


1: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging



