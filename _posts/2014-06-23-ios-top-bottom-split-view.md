---
layout: post
title: iOS Top-Bottom Split View Implementation
date:   2014-06-23 07:00:00
categories: programming
tags:
  - ios
  - interface builder
---

# Summary

Wherein I create a simple top-bottom split view, incorporating
pull-to-reveal.

# Intro

I needed a container view similar to a split view, but more like a
pull-down to refresh. I looked at various options including
[MGSplitViewController](https://github.com/mattgemmell/MGSplitViewController).

There are 3 reasons I forewent using this library:

1. The open issues hinted at iOS 8 issues.
2. The project seems quite inactive
3. My use-case is sufficiently narrow compared to the complexity this
   library offers.

So I decided to implement this myself, and it was suprisingly simple.
Here are the requirements:

1. Upon loading the screen should show a primary view that takes up the entire
   screen (on iPhone devices)
2. A seconary view abutting the primary view's top border should be revealed
   when a user pans down.
3. If a user pans up when the secondary view is visible, that view is
   hidden.
4. (non-functional) It should be easy to maintain each of the views via
   Interface Builder (IB).

# Create the views

I like to start an application by creating the flow in IB. Start with an
empty view controller in IB. Create a `UIScrollView` which takes up the
entire screen. If using auto constraints, you can set the edges of the
scroll view to match the containing view.

Next, create two container views inside the scroll view. The secondary
view should be the top-most view, with the primary view right
underneath. The constraints of the primary view should be set to match
the size of the scroll view (so that it takes up the entire screen). As
we're testing this, it is helpful to set the background colors of the
embed views to different colors to get a visual indicator.

![Interface builder showing container views](/assets/2014-06-23-ios-top-bottom-split-view.png)

# Setup panning

Drag a `UIPanGestureRecognizer` onto the View Controller, and create an
`IBOutlet` for it in the View Controller code. Create an IBAction with
the following signature:

```
(IBAction) didPan: (UIPanGestureRecognizer*) recognizer
```

CTRL+drag in IB from the `UIPanGestureRecognizer` to the `View Controller` to
hook up the `IBAction`. Now we're ready for the final code changes.

# Panning

We will wait until someone pans with a certain speed (you can
calibrate this as desired--I started with 2000). Assuming that only the
primary view is visible, if someone pans down, we want to show the
secondary view, so we subtract the height of the secondary view from the scroll
view's current content offset. Otherwise, we do nothing.

If the secondary view is visible, and the user pans up, we increment the
scroll view content offset by the height of the secondary view.

Finally, before the view appears, because we want to show only the primary
view, we make sure that the scroll view content offset is set to the
height of the secondary view to start things off.

# Troubleshooting

The single most prevalent source of errors was in auto constraints,
which I am still not very proficient with. I found that adding them
several at a time, and evaluating the results via the simulator worked
best.

# Conclusion

That's it in a nutshell. You can view the actual code used at this
repository
[ios-top-down-splitview](https://github.com/jamiely/ios-top-down-splitview). 
See both the `Main.storyboard` and the `ViewController.m`
for the actual code.

